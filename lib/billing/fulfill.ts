import "server-only";

import type Stripe from "stripe";

import { getStripe, PACKS, PRO, type PackId } from "@/lib/stripe";
import { grantCredits, hasInvoiceGrant } from "@/lib/db/credit-ledger";
import { getPaymentBySession, recordPayment } from "@/lib/db/payments";
import {
  setStripeCustomerId,
  upsertSubscription,
} from "@/lib/db/subscriptions";

/**
 * Resolve the AIV user id for a Stripe object. We set client_reference_id
 * on every Checkout Session and stash a `userId` value in subscription
 * metadata, so the lookup is purely local — we never have to query Stripe
 * by email or similar.
 */
function resolveUserId(
  obj:
    | Stripe.Checkout.Session
    | Stripe.Subscription
    | Stripe.Invoice
    | { metadata?: Stripe.Metadata | null; client_reference_id?: string | null }
): string | null {
  if ("client_reference_id" in obj && obj.client_reference_id) {
    return obj.client_reference_id;
  }
  const md = (obj as { metadata?: Stripe.Metadata | null }).metadata;
  if (md && typeof md.userId === "string" && md.userId.length > 0) {
    return md.userId;
  }
  return null;
}

function packFromMetadata(
  md: Stripe.Metadata | null | undefined
): PackId | null {
  const id = md?.packId;
  if (id && id in PACKS) return id as PackId;
  return null;
}

/**
 * Handle a `checkout.session.completed` event. Idempotent: if a payment
 * row already exists for `session.id`, we skip granting again.
 */
export async function fulfillCheckout(
  event: Stripe.CheckoutSessionCompletedEvent
): Promise<void> {
  const session = event.data.object;
  if (session.payment_status !== "paid" && session.mode !== "subscription") {
    // Free trials, manual invoices, etc. We only fulfil paid one-offs here;
    // subscriptions are handled by customer.subscription.* + invoice.paid.
    return;
  }

  const userId = resolveUserId(session);
  if (!userId) {
    console.error("[fulfillCheckout] no userId on session", session.id);
    return;
  }

  // Persist the Stripe customer id on the subscriptions row so future
  // portal sessions / subscriptions can be opened against it.
  if (typeof session.customer === "string") {
    await setStripeCustomerId(userId, session.customer);
  }

  // -------- One-off pack purchase --------
  if (session.mode === "payment") {
    const packId = packFromMetadata(session.metadata);
    if (!packId) {
      console.error("[fulfillCheckout] missing packId metadata", session.id);
      return;
    }
    const pack = PACKS[packId];
    const existing = await getPaymentBySession(session.id);
    if (existing && existing.status === "completed") {
      return; // already credited
    }

    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const payment = await recordPayment({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent: piId,
      pack_id: pack.id,
      amount_usd: pack.amountCents / 100,
      credits_granted: pack.credits,
      status: "completed",
      metadata: { mode: "payment" },
    });

    await grantCredits({
      user_id: userId,
      amount: pack.credits,
      reason: "pack_purchase",
      payment_id: payment?.id ?? null,
      metadata: {
        stripe_session_id: session.id,
        pack_id: pack.id,
        amount_usd: pack.amountCents / 100,
      },
    });
    return;
  }

  // -------- Subscription checkout --------
  if (session.mode === "subscription") {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (!subId) return;
    // The actual record + first credit grant happens on the
    // customer.subscription.created + invoice.paid events that immediately
    // follow. This handler primarily sets the customer id (done above).
    return;
  }
}

/**
 * Handle `customer.subscription.{created,updated,deleted}` and `invoice.paid`.
 *
 * - created/updated: upsert subscription row, refresh status + period.
 * - invoice.paid: idempotently grant the monthly credits keyed off invoice id.
 * - deleted: mark inactive.
 */
export async function recordSubscriptionEvent(
  event:
    | Stripe.CustomerSubscriptionCreatedEvent
    | Stripe.CustomerSubscriptionUpdatedEvent
    | Stripe.CustomerSubscriptionDeletedEvent
    | Stripe.InvoicePaidEvent,
  kind: "created" | "updated" | "renewed" | "cancelled"
): Promise<void> {
  if (kind === "renewed") {
    await handleInvoicePaid(event as Stripe.InvoicePaidEvent);
    return;
  }
  await handleSubscriptionChange(
    event as
      | Stripe.CustomerSubscriptionCreatedEvent
      | Stripe.CustomerSubscriptionUpdatedEvent
      | Stripe.CustomerSubscriptionDeletedEvent,
    kind
  );
}

async function handleSubscriptionChange(
  event:
    | Stripe.CustomerSubscriptionCreatedEvent
    | Stripe.CustomerSubscriptionUpdatedEvent
    | Stripe.CustomerSubscriptionDeletedEvent,
  kind: "created" | "updated" | "cancelled"
): Promise<void> {
  const sub = event.data.object;
  const userId = resolveUserId(sub);
  if (!userId) {
    // For subscription events we may need to look up the userId via the
    // customer. Stripe customers carry our userId in metadata.
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const fetched = await getStripe().customers.retrieve(customerId);
    if (!("deleted" in fetched) || fetched.deleted !== true) {
      const md = (fetched as Stripe.Customer).metadata;
      if (md?.userId) {
        await persistSubscription(sub, md.userId, kind);
      }
    }
    return;
  }
  await persistSubscription(sub, userId, kind);
}

async function persistSubscription(
  sub: Stripe.Subscription,
  userId: string,
  kind: "created" | "updated" | "cancelled"
): Promise<void> {
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? "";
  const isPro = priceId === process.env.STRIPE_PRICE_PRO;

  const status = kind === "cancelled" ? "cancelled" : sub.status;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Period info lives on the item in v2024-06-20+ and on the subscription
  // root pre-2024-06-20; check both.
  const periodStart =
    (item as { current_period_start?: number | null } | undefined)
      ?.current_period_start ??
    (sub as unknown as { current_period_start?: number | null })
      .current_period_start ??
    null;
  const periodEnd =
    (item as { current_period_end?: number | null } | undefined)
      ?.current_period_end ??
    (sub as unknown as { current_period_end?: number | null })
      .current_period_end ??
    null;

  await upsertSubscription({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    plan: isPro ? "pro" : "free",
    status,
    monthly_credits: isPro ? PRO.monthlyCredits : 0,
    current_period_start: periodStart
      ? new Date(periodStart * 1000).toISOString()
      : null,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
  });
}

async function handleInvoicePaid(
  event: Stripe.InvoicePaidEvent
): Promise<void> {
  const invoice = event.data.object;
  if (!invoice.id) return;
  // We only grant credits for subscription renewals. One-off invoices for
  // packs are fulfilled via checkout.session.completed.
  const subscriptionId =
    typeof (invoice as { subscription?: string | Stripe.Subscription | null })
      .subscription === "string"
      ? ((invoice as { subscription?: string }).subscription as string)
      : ((invoice as { subscription?: Stripe.Subscription }).subscription?.id ??
        null);
  if (!subscriptionId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const userId =
    resolveUserId(sub) ?? (await resolveUserIdFromCustomer(sub.customer));
  if (!userId) {
    console.warn("[handleInvoicePaid] no userId for invoice", invoice.id);
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? "";
  if (priceId !== process.env.STRIPE_PRICE_PRO) {
    // Only Pro carries a monthly credit grant for now.
    return;
  }

  if (await hasInvoiceGrant(invoice.id)) {
    return; // idempotent — already credited this billing period
  }

  await grantCredits({
    user_id: userId,
    amount: PRO.monthlyCredits,
    reason: "subscription_grant",
    metadata: {
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      plan: "pro",
    },
  });
}

async function resolveUserIdFromCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer
): Promise<string | null> {
  const id = typeof customer === "string" ? customer : customer.id;
  if (!id) return null;
  const c = await getStripe().customers.retrieve(id);
  if ("deleted" in c && c.deleted) return null;
  return (c as Stripe.Customer).metadata?.userId ?? null;
}

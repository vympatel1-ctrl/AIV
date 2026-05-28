import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import {
  fulfillCheckout,
  recordSubscriptionEvent,
} from "@/lib/billing/fulfill";

export const runtime = "nodejs";

/**
 * Stripe webhook receiver.
 *
 * Next.js 16 specifics:
 *   - We MUST consume the raw body via `req.text()` before any JSON parse,
 *     because Stripe HMAC-signs the bytes Stripe sent us and `req.json()`
 *     would consume the stream and corrupt subsequent reads.
 *   - This route is excluded from `proxy.ts`'s matcher so Supabase cookie
 *     refresh logic never runs on an unauthenticated, signature-verified
 *     POST from Stripe's IPs.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new NextResponse("Missing signature or webhook secret", {
      status: 400,
    });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "Stripe not configured",
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[stripe.webhook] signature verification failed:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await fulfillCheckout(event);
        break;
      case "customer.subscription.created":
        await recordSubscriptionEvent(event, "created");
        break;
      case "customer.subscription.updated":
        await recordSubscriptionEvent(event, "updated");
        break;
      case "customer.subscription.deleted":
        await recordSubscriptionEvent(event, "cancelled");
        break;
      case "invoice.paid":
        await recordSubscriptionEvent(event, "renewed");
        break;
      default:
        // Ignored event — we still 200 so Stripe doesn't keep retrying.
        break;
    }
  } catch (err) {
    console.error(`[stripe.webhook] handler failed for ${event.type}`, err);
    // Returning a non-2xx will make Stripe retry — only do that for
    // transient errors we'd want to retry through.
    return new NextResponse("Handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

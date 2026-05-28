import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  appUrl,
  getPackPriceId,
  getProPriceId,
  getStripe,
  PACKS,
  type PackId,
} from "@/lib/stripe";
import {
  getStripeCustomerId,
  setStripeCustomerId,
} from "@/lib/db/subscriptions";

export const runtime = "nodejs";

const RequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("pack"),
    packId: z.enum(["spark", "creator", "studio", "scale"]),
  }),
  z.object({
    kind: z.literal("pro"),
  }),
]);

/**
 * Resolve or create a Stripe Customer for the current user. We always
 * want a Customer (not a guest checkout) so the Pro subscription has
 * stable billing and the user can manage it via the Billing Portal.
 */
async function ensureCustomer(userId: string, email: string): Promise<string> {
  const cached = await getStripeCustomerId(userId);
  if (cached) return cached;
  const stripe = getStripe();
  const created = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await setStripeCustomerId(userId, created.id);
  return created.id;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe not configured" },
      { status: 500 }
    );
  }

  const origin = appUrl();
  const successUrl = `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/billing?status=cancelled`;

  try {
    const customer = await ensureCustomer(user.userId, user.email);

    if (parsed.data.kind === "pack") {
      const packId: PackId = parsed.data.packId;
      const pack = PACKS[packId];
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer,
        client_reference_id: user.userId,
        line_items: [{ price: getPackPriceId(packId), quantity: 1 }],
        metadata: { userId: user.userId, packId, kind: "pack" },
        payment_intent_data: {
          metadata: { userId: user.userId, packId, kind: "pack" },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
      });
      return NextResponse.json({
        ok: true,
        url: session.url,
        pack: { id: pack.id, name: pack.name, credits: pack.credits },
      });
    }

    // Pro subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.userId,
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      metadata: { userId: user.userId, kind: "pro" },
      subscription_data: {
        metadata: { userId: user.userId, kind: "pro" },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[/api/stripe/checkout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

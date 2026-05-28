import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { appUrl, getStripe } from "@/lib/stripe";
import { getStripeCustomerId } from "@/lib/db/subscriptions";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  const customerId = await getStripeCustomerId(user.userId);
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing history yet — make a purchase first." },
      { status: 400 }
    );
  }
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl()}/billing`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[/api/stripe/portal]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Portal session failed" },
      { status: 500 }
    );
  }
}

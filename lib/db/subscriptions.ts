import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Subscription } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data } = await sb
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertSubscription(input: {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan: "free" | "starter" | "pro" | "business";
  status: string;
  monthly_credits: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}): Promise<Subscription | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("subscriptions")
    .upsert(
      {
        user_id: input.user_id,
        stripe_customer_id: input.stripe_customer_id,
        stripe_subscription_id: input.stripe_subscription_id,
        stripe_price_id: input.stripe_price_id,
        plan: input.plan,
        status: input.status,
        monthly_credits: input.monthly_credits,
        current_period_start: input.current_period_start ?? null,
        current_period_end: input.current_period_end ?? null,
        cancel_at_period_end: input.cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  if (error) {
    console.warn("[upsertSubscription]", error.message);
    return null;
  }
  return data;
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const sb = safeClient();
  if (!sb) return;
  const existing = await getSubscription(userId);
  if (existing) {
    await sb
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return;
  }
  await sb.from("subscriptions").insert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    plan: "free",
    status: "active",
    monthly_credits: 0,
    cancel_at_period_end: false,
  });
}

export async function getStripeCustomerId(
  userId: string
): Promise<string | null> {
  const sub = await getSubscription(userId);
  return sub?.stripe_customer_id ?? null;
}

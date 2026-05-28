import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Payment } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function getPaymentBySession(
  stripeSessionId: string
): Promise<Payment | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data } = await sb
    .from("payments")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();
  return data ?? null;
}

export async function recordPayment(input: {
  user_id: string;
  stripe_session_id: string;
  stripe_payment_intent?: string | null;
  pack_id: string | null;
  amount_usd: number;
  credits_granted: number;
  status?: "completed" | "refunded" | "failed";
  metadata?: Json | null;
}): Promise<Payment | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("payments")
    .insert({
      user_id: input.user_id,
      stripe_session_id: input.stripe_session_id,
      stripe_payment_intent: input.stripe_payment_intent ?? null,
      pack_id: input.pack_id,
      amount_usd: input.amount_usd,
      credits_granted: input.credits_granted,
      status: input.status ?? "completed",
      metadata: input.metadata ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn("[recordPayment]", error.message);
    return null;
  }
  return data;
}

export async function listUserPayments(
  userId: string,
  limit = 50
): Promise<Payment[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

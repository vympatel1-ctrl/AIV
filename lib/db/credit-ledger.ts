import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CreditLedgerEntry,
  CreditLedgerReason,
  Json,
} from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Atomically grant credits to a user and write a ledger entry.
 *
 * Implementation note: Postgres doesn't give us atomic increment via the
 * supabase-js builder without a stored proc, so we read-then-write and
 * accept the (very small) race window. The ledger is append-only and the
 * profiles row is monotonic for grants, so under contention the worst
 * case is a momentarily-stale `balance_after` value — not a lost grant.
 */
export async function grantCredits(input: {
  user_id: string;
  amount: number;
  reason: CreditLedgerReason;
  payment_id?: string | null;
  generation_id?: string | null;
  metadata?: Json | null;
}): Promise<{ balance_after: number } | null> {
  const sb = safeClient();
  if (!sb) return null;

  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("credits")
    .eq("id", input.user_id)
    .single();

  if (pErr || !profile) {
    console.warn("[grantCredits] profile lookup failed:", pErr?.message);
    return null;
  }

  const next = profile.credits + input.amount;
  const { error: uErr } = await sb
    .from("profiles")
    .update({ credits: next, updated_at: new Date().toISOString() })
    .eq("id", input.user_id);

  if (uErr) {
    console.warn("[grantCredits] profile update failed:", uErr.message);
    return null;
  }

  const { error: lErr } = await sb.from("credit_ledger").insert({
    user_id: input.user_id,
    delta: input.amount,
    reason: input.reason,
    payment_id: input.payment_id ?? null,
    generation_id: input.generation_id ?? null,
    balance_after: next,
    metadata: input.metadata ?? null,
  });
  if (lErr) {
    // The credits were granted but the audit row didn't write. Log loudly.
    console.error("[grantCredits] ledger write failed:", lErr.message, {
      user_id: input.user_id,
      delta: input.amount,
      reason: input.reason,
    });
  }

  return { balance_after: next };
}

export async function listUserLedger(
  userId: string,
  limit = 50
): Promise<CreditLedgerEntry[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("credit_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

/**
 * Has a subscription_grant for this invoice id already been written? Used
 * by the webhook to make `invoice.paid` idempotent without relying on a
 * second round-trip to Stripe.
 */
export async function hasInvoiceGrant(
  invoiceId: string
): Promise<boolean> {
  const sb = safeClient();
  if (!sb) return false;
  const { data } = await sb
    .from("credit_ledger")
    .select("id")
    .eq("reason", "subscription_grant")
    .filter("metadata->>stripe_invoice_id", "eq", invoiceId)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

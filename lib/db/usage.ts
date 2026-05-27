import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  GenerationKind,
  Json,
  UsageEvent,
} from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function logUsage(input: {
  user_id: string;
  generation_id?: string | null;
  kind: GenerationKind;
  model: string;
  credits: number;
  cost_usd: number;
  metadata?: Json | null;
}): Promise<UsageEvent | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("usage_events")
    .insert({
      user_id: input.user_id,
      generation_id: input.generation_id ?? null,
      kind: input.kind,
      model: input.model,
      credits: input.credits,
      cost_usd: input.cost_usd,
      metadata: input.metadata ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn("[logUsage]", error.message);
    return null;
  }
  return data;
}

export async function listAllUsage(limit = 200): Promise<UsageEvent[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("usage_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function listUserUsage(
  userId: string,
  limit = 100
): Promise<UsageEvent[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("usage_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function refundCredits(
  userId: string,
  amount: number
): Promise<void> {
  const sb = safeClient();
  if (!sb) return;
  const { data: profile } = await sb
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  if (!profile) return;
  await sb
    .from("profiles")
    .update({
      credits: profile.credits + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number }> {
  const sb = safeClient();
  if (!sb) return { ok: true, remaining: 0 };

  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  if (pErr || !profile) {
    console.warn("[deductCredits] profile lookup failed:", pErr?.message);
    return { ok: false, remaining: 0 };
  }
  if (profile.credits < amount) {
    return { ok: false, remaining: profile.credits };
  }
  const remaining = profile.credits - amount;
  const { error: uErr } = await sb
    .from("profiles")
    .update({ credits: remaining, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (uErr) {
    console.warn("[deductCredits]", uErr.message);
    return { ok: false, remaining: profile.credits };
  }
  return { ok: true, remaining };
}

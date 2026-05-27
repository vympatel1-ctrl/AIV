import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Generation, GenerationKind, GenerationStatus, Json } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function createGeneration(input: {
  user_id: string;
  project_id?: string | null;
  kind: GenerationKind;
  provider: string;
  model: string;
  prompt: Json;
  credits_cost: number;
  status?: GenerationStatus;
  external_id?: string | null;
}): Promise<Generation | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("generations")
    .insert({
      user_id: input.user_id,
      project_id: input.project_id ?? null,
      kind: input.kind,
      provider: input.provider,
      model: input.model,
      prompt: input.prompt,
      credits_cost: input.credits_cost,
      status: input.status ?? "queued",
      external_id: input.external_id ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn("[createGeneration]", error.message);
    return null;
  }
  return data;
}

export async function updateGeneration(
  id: string,
  patch: Partial<Generation>
): Promise<Generation | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("generations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.warn("[updateGeneration]", error.message);
    return null;
  }
  return data;
}

export async function getGeneration(
  id: string
): Promise<Generation | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("generations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function listRecentGenerations(
  userId: string,
  limit = 50
): Promise<Generation[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function listAllProfiles(): Promise<Profile[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function setProfileCredits(id: string, credits: number) {
  const sb = safeClient();
  if (!sb) return;
  await sb
    .from("profiles")
    .update({ credits, updated_at: new Date().toISOString() })
    .eq("id", id);
}

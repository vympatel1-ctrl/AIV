import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandKit } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function listBrandKits(userId: string): Promise<BrandKit[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("brand_kits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getBrandKit(
  userId: string,
  id: string
): Promise<BrandKit | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("brand_kits")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function createBrandKit(
  userId: string,
  input: {
    name: string;
    primary_color?: string | null;
    accent_color?: string | null;
    font_family?: string | null;
    logo_url?: string | null;
  }
): Promise<BrandKit> {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("brand_kits")
    .insert({
      user_id: userId,
      name: input.name,
      primary_color: input.primary_color ?? null,
      accent_color: input.accent_color ?? null,
      font_family: input.font_family ?? null,
      logo_url: input.logo_url ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBrandKit(userId: string, id: string) {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("brand_kits")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Project } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function listProjects(
  userId: string,
  opts: { limit?: number; category?: string | null } = {}
): Promise<Project[]> {
  const sb = safeClient();
  if (!sb) return [];

  let q = sb
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (opts.limit) q = q.limit(opts.limit);
  if (opts.category) q = q.eq("category", opts.category);

  const { data, error } = await q;
  if (error) {
    console.warn("[listProjects]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getProject(
  userId: string,
  id: string
): Promise<Project | null> {
  const sb = safeClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[getProject]", error.message);
    return null;
  }
  return data;
}

export async function createProject(
  userId: string,
  input: {
    name: string;
    description?: string | null;
    category?: string | null;
    cover_url?: string | null;
    brand_kit_id?: string | null;
  }
): Promise<Project> {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");

  const { data, error } = await sb
    .from("projects")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      cover_url: input.cover_url ?? null,
      brand_kit_id: input.brand_kit_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(
  userId: string,
  id: string,
  patch: Partial<Project>
): Promise<Project> {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");

  const { data, error } = await sb
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(userId: string, id: string) {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");

  const { error } = await sb
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listProjectCategories(userId: string): Promise<string[]> {
  const sb = safeClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("projects")
    .select("category")
    .eq("user_id", userId)
    .not("category", "is", null);
  if (error) return [];
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) set.add(row.category);
  }
  return Array.from(set).sort();
}

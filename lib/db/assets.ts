import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Asset, AssetType, Json } from "@/types/database";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function listProjectAssets(
  userId: string,
  projectId: string
): Promise<Asset[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[listProjectAssets]", error.message);
    return [];
  }
  return data ?? [];
}

export async function listRecentAssets(
  userId: string,
  limit = 12
): Promise<Asset[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[listRecentAssets]", error.message);
    return [];
  }
  return data ?? [];
}

export async function listAssetsByType(
  userId: string,
  type: AssetType | null,
  opts: { limit?: number; projectId?: string | null } = {}
): Promise<Asset[]> {
  const sb = safeClient();
  if (!sb) return [];
  let q = sb
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 60);
  if (type) q = q.eq("type", type);
  if (opts.projectId) q = q.eq("project_id", opts.projectId);
  const { data, error } = await q;
  if (error) {
    console.warn("[listAssetsByType]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Returns every asset that shares a lineage_id (the chain of refinements
 * for a single video edit session), ordered oldest first.
 */
export async function listAssetLineage(
  userId: string,
  lineageId: string
): Promise<Asset[]> {
  const sb = safeClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .filter("metadata->>lineage_id", "eq", lineageId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[listAssetLineage]", error.message);
    return [];
  }
  return data ?? [];
}

export async function createAsset(
  userId: string,
  input: {
    project_id?: string | null;
    type: AssetType;
    title?: string | null;
    content?: Json | null;
    file_url?: string | null;
    thumbnail_url?: string | null;
    mime_type?: string | null;
    metadata?: Json | null;
    generation_id?: string | null;
  }
): Promise<Asset> {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("assets")
    .insert({
      user_id: userId,
      project_id: input.project_id ?? null,
      type: input.type,
      title: input.title ?? null,
      content: input.content ?? null,
      file_url: input.file_url ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      mime_type: input.mime_type ?? null,
      metadata: input.metadata ?? null,
      generation_id: input.generation_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAsset(userId: string, id: string) {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("assets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getAsset(
  userId: string,
  id: string
): Promise<Asset | null> {
  const sb = safeClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("assets")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function moveAssetToProject(
  userId: string,
  assetId: string,
  projectId: string | null
) {
  const sb = safeClient();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("assets")
    .update({
      project_id: projectId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("user_id", userId);
  if (error) throw error;
}

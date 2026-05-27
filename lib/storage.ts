import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const ASSETS_BUCKET = "assets";
export const UPLOADS_BUCKET = "uploads";

function safeClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Upload a Buffer / Blob / Uint8Array to the public `assets` bucket and
 * return the public URL.
 */
export async function uploadToAssets(opts: {
  userId: string;
  path: string;
  body: Buffer | Uint8Array | Blob;
  contentType: string;
  upsert?: boolean;
}): Promise<{ path: string; publicUrl: string } | null> {
  const sb = safeClient();
  if (!sb) return null;

  const objectPath = `${opts.userId}/${opts.path}`;
  const { error } = await sb.storage
    .from(ASSETS_BUCKET)
    .upload(objectPath, opts.body, {
      contentType: opts.contentType,
      upsert: opts.upsert ?? false,
    });
  if (error) {
    console.warn("[uploadToAssets]", error.message);
    return null;
  }
  const { data } = sb.storage.from(ASSETS_BUCKET).getPublicUrl(objectPath);
  return { path: objectPath, publicUrl: data.publicUrl };
}

/**
 * Upload to the private `uploads` bucket and return a signed URL good for 1h.
 */
export async function uploadToUploads(opts: {
  userId: string;
  path: string;
  body: Buffer | Uint8Array | Blob;
  contentType: string;
  upsert?: boolean;
}): Promise<{ path: string; signedUrl: string | null } | null> {
  const sb = safeClient();
  if (!sb) return null;

  const objectPath = `${opts.userId}/${opts.path}`;
  const { error } = await sb.storage
    .from(UPLOADS_BUCKET)
    .upload(objectPath, opts.body, {
      contentType: opts.contentType,
      upsert: opts.upsert ?? false,
    });
  if (error) {
    console.warn("[uploadToUploads]", error.message);
    return null;
  }
  const signed = await sb.storage
    .from(UPLOADS_BUCKET)
    .createSignedUrl(objectPath, 60 * 60);
  return { path: objectPath, signedUrl: signed.data?.signedUrl ?? null };
}

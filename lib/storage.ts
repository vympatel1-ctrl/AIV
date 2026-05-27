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
 * Download a remote (typically provider-hosted) video and re-upload it to the
 * public `assets` bucket so the link never expires. Returns the new public URL,
 * or `null` if storage isn't configured / the fetch fails.
 *
 * `kind` controls the on-bucket folder so videos are organized predictably.
 */
export async function persistRemoteFileToAssets(opts: {
  userId: string;
  remoteUrl: string;
  kind?: "video" | "image" | "audio";
  fallbackContentType?: string;
  filenameHint?: string;
}): Promise<{ path: string; publicUrl: string; contentType: string; bytes: number } | null> {
  const sb = safeClient();
  if (!sb) return null;

  let res: Response;
  try {
    res = await fetch(opts.remoteUrl, { cache: "no-store" });
  } catch (err) {
    console.warn("[persistRemoteFileToAssets] fetch threw", err);
    return null;
  }
  if (!res.ok || !res.body) {
    console.warn("[persistRemoteFileToAssets] non-OK", res.status, opts.remoteUrl);
    return null;
  }

  const contentType =
    res.headers.get("content-type") ??
    opts.fallbackContentType ??
    (opts.kind === "video"
      ? "video/mp4"
      : opts.kind === "audio"
      ? "audio/mpeg"
      : "image/png");

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 256) {
    console.warn(
      "[persistRemoteFileToAssets] downloaded buffer too small",
      buf.byteLength
    );
    return null;
  }

  const ext = pickExtForContentType(contentType, opts.remoteUrl);
  const folder = opts.kind ?? "video";
  const slug = (opts.filenameHint ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${slug ? `-${slug}` : ""}.${ext}`;

  const stored = await uploadToAssets({
    userId: opts.userId,
    path,
    body: buf,
    contentType,
  });
  if (!stored) return null;

  return {
    path: stored.path,
    publicUrl: stored.publicUrl,
    contentType,
    bytes: buf.byteLength,
  };
}

function pickExtForContentType(ct: string, url: string): string {
  const c = ct.toLowerCase();
  if (c.includes("mp4")) return "mp4";
  if (c.includes("webm")) return "webm";
  if (c.includes("quicktime") || c.includes("mov")) return "mov";
  if (c.includes("png")) return "png";
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("webp")) return "webp";
  if (c.includes("mpeg") && !c.includes("video")) return "mp3";
  if (c.includes("wav")) return "wav";
  const m = url.toLowerCase().match(/\.(mp4|mov|webm|m4v|png|jpg|jpeg|webp|mp3|wav)(\?|$)/);
  if (m) return m[1] === "jpeg" ? "jpg" : m[1];
  return "bin";
}

/**
 * Delete an object from the assets bucket. Path is the bucket-relative path
 * returned from upload helpers.
 */
export async function deleteFromAssets(path: string): Promise<boolean> {
  const sb = safeClient();
  if (!sb) return false;
  const { error } = await sb.storage.from(ASSETS_BUCKET).remove([path]);
  if (error) {
    console.warn("[deleteFromAssets]", error.message);
    return false;
  }
  return true;
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

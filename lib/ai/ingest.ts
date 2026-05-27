import "server-only";

import { uploadToAssets } from "@/lib/storage";

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB hard cap

const VIDEO_MIME_PREFIXES = ["video/"];
const ACCEPTED_EXTS = ["mp4", "mov", "webm", "m4v"];

export type IngestResult = {
  videoUrl: string;
  storedPath: string;
  contentType: string;
  bytes: number;
  source: "direct" | "tiktok" | "instagram" | "youtube" | "x" | "facebook";
};

export class IngestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function detectPlatform(url: URL): IngestResult["source"] {
  const h = url.hostname.toLowerCase();
  if (h.includes("tiktok.com")) return "tiktok";
  if (h.includes("instagram.com")) return "instagram";
  if (h.includes("youtube.com") || h.includes("youtu.be")) return "youtube";
  if (h === "x.com" || h.includes("twitter.com")) return "x";
  if (h.includes("facebook.com") || h.includes("fb.watch")) return "facebook";
  return "direct";
}

/**
 * Resolve a social-platform URL into a direct MP4 URL.
 *
 * We deliberately do NOT bundle a scraper. Instead we hit a user-provided
 * resolver service (RapidAPI / Apify / your own). If `VIDEO_INGEST_RESOLVER_URL`
 * isn't set, we throw a helpful error and the user can fall back to upload.
 *
 * Expected response shape from the resolver:
 *   { url: "https://..." }   // a direct .mp4 URL we can fetch & re-host
 */
async function resolveSocialUrl(input: string): Promise<string> {
  const endpoint = process.env.VIDEO_INGEST_RESOLVER_URL;
  if (!endpoint) {
    throw new IngestError(
      "This is a social-platform link. Configure VIDEO_INGEST_RESOLVER_URL on the server, or upload the MP4 directly.",
      501
    );
  }
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.VIDEO_INGEST_RESOLVER_KEY) {
    headers["authorization"] = `Bearer ${process.env.VIDEO_INGEST_RESOLVER_KEY}`;
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: input }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new IngestError(
      `Resolver returned ${res.status}. Try uploading the MP4 directly.`,
      502
    );
  }
  const json = (await res.json().catch(() => ({}))) as { url?: string };
  if (!json.url) {
    throw new IngestError(
      "Resolver did not return a video URL. Try uploading the MP4 directly.",
      502
    );
  }
  return json.url;
}

function pickExt(contentType: string, url: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes("mp4")) return "mp4";
  if (ct.includes("webm")) return "webm";
  if (ct.includes("quicktime")) return "mov";
  const m = url.toLowerCase().match(/\.(mp4|mov|webm|m4v)(\?|$)/);
  if (m) return m[1];
  return "mp4";
}

/**
 * Fetch a remote video and persist it to the assets bucket.
 * Throws IngestError with an HTTP-meaningful status on user-facing problems.
 */
export async function ingestVideoFromUrl(
  rawUrl: string,
  userId: string
): Promise<IngestResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new IngestError("Invalid URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new IngestError("Only http(s) URLs are supported");
  }

  const platform = detectPlatform(parsed);

  let directUrl = rawUrl;
  if (platform !== "direct") {
    directUrl = await resolveSocialUrl(rawUrl);
  }

  const headRes = await fetch(directUrl, { method: "HEAD" }).catch(() => null);
  if (headRes && headRes.ok) {
    const lenStr = headRes.headers.get("content-length");
    if (lenStr) {
      const len = Number(lenStr);
      if (Number.isFinite(len) && len > MAX_BYTES) {
        throw new IngestError(
          `Video is ${(len / 1_000_000).toFixed(1)} MB. Max is ${MAX_BYTES / 1_000_000} MB.`,
          413
        );
      }
    }
  }

  const res = await fetch(directUrl, { cache: "no-store" });
  if (!res.ok || !res.body) {
    throw new IngestError(`Failed to fetch video (${res.status})`, 502);
  }
  const contentType = res.headers.get("content-type") ?? "video/mp4";
  const isVideoLike =
    VIDEO_MIME_PREFIXES.some((p) => contentType.startsWith(p)) ||
    ACCEPTED_EXTS.some((e) => directUrl.toLowerCase().includes(`.${e}`));
  if (!isVideoLike) {
    throw new IngestError(
      `URL did not return a video (got ${contentType}). Paste a direct MP4 link or upload the file.`,
      415
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) {
    throw new IngestError(
      `Video is ${(buf.byteLength / 1_000_000).toFixed(1)} MB. Max is ${MAX_BYTES / 1_000_000} MB.`,
      413
    );
  }
  if (buf.byteLength < 1024) {
    throw new IngestError("Downloaded file is too small to be a video", 422);
  }

  const ext = pickExt(contentType, directUrl);
  const path = `ingested/${platform}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const stored = await uploadToAssets({
    userId,
    path,
    body: buf,
    contentType,
  });
  if (!stored) {
    throw new IngestError("Storage not configured", 503);
  }

  return {
    videoUrl: stored.publicUrl,
    storedPath: stored.path,
    contentType,
    bytes: buf.byteLength,
    source: platform,
  };
}

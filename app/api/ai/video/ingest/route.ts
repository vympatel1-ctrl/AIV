import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { IngestError, ingestVideoFromUrl } from "@/lib/ai/ingest";
import { VideoIngestRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/video/ingest
 * { url: "https://..." }
 *
 * Resolves the URL into a playable MP4, persists it to the user's assets
 * bucket, and returns { videoUrl } so the client can pass it straight into
 * /api/ai/video as a video-to-video source.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = VideoIngestRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await ingestVideoFromUrl(parsed.data.url, user.userId);
    return NextResponse.json({
      ok: true,
      videoUrl: result.videoUrl,
      source: result.source,
      bytes: result.bytes,
      contentType: result.contentType,
    });
  } catch (err) {
    if (err instanceof IngestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/ai/video/ingest] failed", err);
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

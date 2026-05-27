import { NextResponse, type NextRequest } from "next/server";

import { getVideoProvider } from "@/lib/ai/video";
import { createAsset } from "@/lib/db/assets";
import {
  getGeneration,
  updateGeneration,
} from "@/lib/db/generations";
import { logUsage } from "@/lib/db/usage";
import { costFor } from "@/lib/credits";
import { getCurrentUser } from "@/lib/auth/current-user";
import { persistRemoteFileToAssets } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/ai/video/[id]/status">
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  const gen = await getGeneration(id);
  if (!gen || gen.user_id !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (gen.status === "succeeded" || gen.status === "failed") {
    return NextResponse.json({
      status: gen.status,
      output: gen.output,
      error: gen.error,
    });
  }
  if (!gen.external_id) {
    return NextResponse.json({ status: gen.status });
  }

  const promptMeta = gen.prompt as {
    prompt?: string;
    aspectRatio?: string;
    mode?: string;
    lineageId?: string;
    parentAssetId?: string | null;
    provider?: string;
  };
  const provider = getVideoProvider(
    (promptMeta?.provider as "fal" | "runway" | undefined) ?? null
  );
  try {
    const s = await provider.status(gen.external_id, gen.model);

    if (s.status === "succeeded" && s.videoUrl) {
      // Provider URLs (Runway / fal) expire after a day or two. Re-host the
      // MP4 in our public assets bucket so users can rewatch / download
      // months later.
      const persisted = await persistRemoteFileToAssets({
        userId: user.userId,
        remoteUrl: s.videoUrl,
        kind: "video",
        fallbackContentType: "video/mp4",
        filenameHint: promptMeta?.prompt,
      });

      let persistedThumbnail: string | null = s.thumbnailUrl ?? null;
      if (s.thumbnailUrl) {
        const t = await persistRemoteFileToAssets({
          userId: user.userId,
          remoteUrl: s.thumbnailUrl,
          kind: "image",
          fallbackContentType: "image/jpeg",
          filenameHint: `${promptMeta?.prompt ?? "thumb"}-thumb`,
        });
        if (t) persistedThumbnail = t.publicUrl;
      }

      const fileUrl = persisted?.publicUrl ?? s.videoUrl;
      const storagePath = persisted?.path ?? null;

      const asset = await createAsset(user.userId, {
        project_id: gen.project_id,
        type: "video",
        title: promptMeta?.prompt?.slice(0, 80) ?? "Generated video",
        file_url: fileUrl,
        thumbnail_url: persistedThumbnail,
        mime_type: persisted?.contentType ?? "video/mp4",
        generation_id: gen.id,
        metadata: {
          aspect: promptMeta?.aspectRatio,
          mode: promptMeta?.mode,
          lineage_id: promptMeta?.lineageId ?? null,
          parent_asset_id: promptMeta?.parentAssetId ?? null,
          prompt: promptMeta?.prompt,
          provider_url: s.videoUrl,
          storage_path: storagePath,
          bytes: persisted?.bytes ?? null,
          persisted: Boolean(persisted),
        },
      });
      await updateGeneration(gen.id, {
        status: "succeeded",
        output: {
          videoUrl: fileUrl,
          provider_url: s.videoUrl,
          asset_id: asset.id,
        },
        completed_at: new Date().toISOString(),
      });
      await logUsage({
        user_id: user.userId,
        generation_id: gen.id,
        kind: "video",
        model: gen.model,
        credits: gen.credits_cost,
        cost_usd: costFor("video", 1),
      });
      return NextResponse.json({
        status: "succeeded",
        videoUrl: fileUrl,
        asset,
      });
    }

    if (s.status === "failed") {
      await updateGeneration(gen.id, {
        status: "failed",
        error: s.error ?? "Provider failed",
        completed_at: new Date().toISOString(),
      });
      return NextResponse.json({ status: "failed", error: s.error });
    }

    return NextResponse.json({ status: s.status });
  } catch (err) {
    return NextResponse.json(
      {
        status: "failed",
        error: err instanceof Error ? err.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}

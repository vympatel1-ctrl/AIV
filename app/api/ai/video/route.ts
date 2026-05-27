import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { getVideoProvider } from "@/lib/ai/video";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createGeneration } from "@/lib/db/generations";
import { deductCredits, refundCredits } from "@/lib/db/usage";
import { creditsFor } from "@/lib/credits";
import { VideoRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/video — submits a video job to the active provider.
 * Returns a generation row id; the client polls /api/ai/video/[id]/status.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = VideoRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.mode === "video-to-video" && !input.videoUrl) {
    return NextResponse.json(
      { error: "videoUrl is required for video-to-video" },
      { status: 400 }
    );
  }

  const credits = creditsFor("video", 1);
  const balance = await deductCredits(user.userId, credits);
  if (!balance.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", remaining: balance.remaining },
      { status: 402 }
    );
  }

  const provider = getVideoProvider(input.provider ?? null);
  try {
    const submission = await provider.submit({
      mode: input.mode,
      prompt: input.prompt,
      imageUrl: input.imageUrl ?? undefined,
      videoUrl: input.videoUrl ?? undefined,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
      model: input.model,
    });

    const lineageId = input.lineageId ?? randomUUID();
    const gen = await createGeneration({
      user_id: user.userId,
      project_id: input.projectId ?? null,
      kind: "video",
      provider: submission.provider,
      model: submission.model,
      prompt: {
        ...input,
        lineageId,
        parentAssetId: input.parentAssetId ?? null,
      },
      credits_cost: credits,
      status: "processing",
      external_id: submission.externalId,
    });

    return NextResponse.json({
      ok: true,
      generationId: gen?.id ?? null,
      externalId: submission.externalId,
      provider: submission.provider,
      model: submission.model,
      lineageId,
      parentAssetId: input.parentAssetId ?? null,
      remaining: balance.remaining,
    });
  } catch (err) {
    console.error("[/api/ai/video] submit failed", err);
    await refundCredits(user.userId, credits).catch(() => {});
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

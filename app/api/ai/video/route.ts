import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { getVideoProvider } from "@/lib/ai/video";
import { buildVideoRemixPrompt } from "@/lib/ai/prompts";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBrandKit } from "@/lib/db/brand-kits";
import { createGeneration } from "@/lib/db/generations";
import { deductCredits, refundCredits } from "@/lib/db/usage";
import { getGenerationCost } from "@/lib/credits";
import { VideoRequestSchema } from "@/lib/validators";
import {
  DEFAULT_TEXT_VIDEO_MODEL,
  DEFAULT_VIDEO_MODEL,
} from "@/lib/ai/video";

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

  // Price the job up front using the user-supplied model + duration so the
  // charge matches what the provider will actually bill us.
  const resolvedModel =
    input.model ??
    (input.mode === "image-to-video"
      ? DEFAULT_VIDEO_MODEL
      : DEFAULT_TEXT_VIDEO_MODEL);
  const cost = getGenerationCost({
    kind: "video",
    model: resolvedModel,
    durationSeconds: input.durationSeconds,
    mode: input.mode,
  });
  const credits = cost.credits;
  const balance = await deductCredits(user.userId, credits);
  if (!balance.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", remaining: balance.remaining },
      { status: 402 }
    );
  }

  // If the caller supplied a brandKitId on a video-to-video job, rewrite the
  // prompt server-side using the trusted brand record. The user's free-form
  // text becomes the "creative direction" inside the remix prompt.
  let effectivePrompt = input.prompt;
  let brandSnapshot: {
    id: string;
    name: string;
    primary_color: string | null;
    accent_color: string | null;
    font_family: string | null;
    has_logo: boolean;
  } | null = null;

  if (input.mode === "video-to-video" && input.brandKitId) {
    const kit = await getBrandKit(user.userId, input.brandKitId);
    if (kit) {
      brandSnapshot = {
        id: kit.id,
        name: kit.name,
        primary_color: kit.primary_color,
        accent_color: kit.accent_color,
        font_family: kit.font_family,
        has_logo: Boolean(kit.logo_url),
      };
      effectivePrompt = buildVideoRemixPrompt({
        userPrompt: input.prompt,
        brand: {
          name: kit.name,
          primaryColor: kit.primary_color,
          accentColor: kit.accent_color,
          fontFamily: kit.font_family,
          hasLogo: Boolean(kit.logo_url),
        },
      });
    }
  }

  const provider = getVideoProvider(input.provider ?? null);
  try {
    const submission = await provider.submit({
      mode: input.mode,
      prompt: effectivePrompt,
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
        prompt: effectivePrompt,
        userPrompt: input.prompt,
        brand: brandSnapshot,
        sourceUrl: input.sourceUrl ?? null,
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

import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_MODEL_ID, generateVoiceover } from "@/lib/ai/elevenlabs";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createGeneration, updateGeneration } from "@/lib/db/generations";
import { createAsset } from "@/lib/db/assets";
import { deductCredits, logUsage, refundCredits } from "@/lib/db/usage";
import { creditsFor, costFor } from "@/lib/credits";
import { VoiceoverRequestSchema } from "@/lib/validators";
import { uploadToAssets } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = VoiceoverRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const credits = creditsFor("voiceover", 1);

  const balance = await deductCredits(user.userId, credits);
  if (!balance.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", remaining: balance.remaining },
      { status: 402 }
    );
  }

  const gen = await createGeneration({
    user_id: user.userId,
    project_id: input.projectId ?? null,
    kind: "voiceover",
    provider: "elevenlabs",
    model: DEFAULT_MODEL_ID,
    prompt: input,
    credits_cost: credits,
    status: "processing",
  });

  const start = Date.now();
  try {
    const audio = await generateVoiceover({
      text: input.text,
      voiceId: input.voiceId,
    });
    const path = `audio/${gen?.id ?? Date.now()}.mp3`;
    const upload = await uploadToAssets({
      userId: user.userId,
      path,
      body: audio,
      contentType: "audio/mpeg",
    });
    const fileUrl = upload?.publicUrl ?? null;

    const asset = await createAsset(user.userId, {
      project_id: input.projectId ?? null,
      type: "audio",
      title: input.text.slice(0, 80),
      file_url: fileUrl,
      mime_type: "audio/mpeg",
      generation_id: gen?.id ?? null,
      metadata: { voiceId: input.voiceId ?? null },
    });

    if (gen) {
      await updateGeneration(gen.id, {
        status: "succeeded",
        output: { asset_id: asset.id, fileUrl },
        latency_ms: Date.now() - start,
        completed_at: new Date().toISOString(),
      });
    }
    await logUsage({
      user_id: user.userId,
      generation_id: gen?.id ?? null,
      kind: "voiceover",
      model: DEFAULT_MODEL_ID,
      credits,
      cost_usd: costFor("voiceover", 1),
    });

    return NextResponse.json({
      ok: true,
      asset,
      remaining: balance.remaining,
    });
  } catch (err) {
    console.error("[/api/ai/voiceover] failed", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    if (gen) {
      await updateGeneration(gen.id, {
        status: "failed",
        error: message,
        latency_ms: Date.now() - start,
        completed_at: new Date().toISOString(),
      });
    }
    await refundCredits(user.userId, credits).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

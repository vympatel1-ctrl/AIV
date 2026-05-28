import { NextResponse, type NextRequest } from "next/server";

import { generateImage, OPENAI_IMAGE_MODEL } from "@/lib/ai/openai";
import { buildFlyerPrompt } from "@/lib/ai/prompts";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createGeneration, updateGeneration } from "@/lib/db/generations";
import { createAsset } from "@/lib/db/assets";
import { deductCredits, logUsage, refundCredits } from "@/lib/db/usage";
import { getGenerationCost } from "@/lib/credits";
import { FlyerRequestSchema } from "@/lib/validators";
import {
  ASPECT_TO_OPENAI_SIZE,
  type AspectRatio,
} from "@/lib/platform-presets";
import { uploadToAssets } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = FlyerRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const cost = getGenerationCost({ kind: "flyer" });
  const credits = cost.credits;
  const balance = await deductCredits(user.userId, credits);
  if (!balance.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", remaining: balance.remaining },
      { status: 402 }
    );
  }

  const finalPrompt = buildFlyerPrompt({
    type: input.type,
    prompt: input.prompt,
    brand: {
      name: input.brandName,
      tagline: input.tagline,
      colors: { primary: input.primaryColor, accent: input.accentColor },
      font: input.fontFamily,
    },
  });

  const gen = await createGeneration({
    user_id: user.userId,
    project_id: input.projectId ?? null,
    kind: "flyer",
    provider: "openai",
    model: OPENAI_IMAGE_MODEL,
    prompt: { ...input, finalPrompt },
    credits_cost: credits,
    status: "processing",
  });

  const start = Date.now();
  try {
    const aspect: AspectRatio =
      input.type === "business_card" ? "16:9" : (input.aspect as AspectRatio);
    const size = ASPECT_TO_OPENAI_SIZE[aspect];
    const { b64Images } = await generateImage({
      prompt: finalPrompt,
      size,
      quality: "high",
      n: 1,
    });
    if (b64Images.length === 0) throw new Error("OpenAI returned no images");

    const buffer = Buffer.from(b64Images[0], "base64");
    const path = `flyers/${gen?.id ?? Date.now()}.png`;
    const upload = await uploadToAssets({
      userId: user.userId,
      path,
      body: buffer,
      contentType: "image/png",
    });
    const fileUrl =
      upload?.publicUrl ?? `data:image/png;base64,${b64Images[0]}`;

    const asset = await createAsset(user.userId, {
      project_id: input.projectId ?? null,
      type: "flyer",
      title:
        input.type === "business_card" ? "Business card" : "Flyer",
      file_url: fileUrl,
      thumbnail_url: fileUrl,
      mime_type: "image/png",
      generation_id: gen?.id ?? null,
      metadata: {
        type: input.type,
        aspect,
        brandName: input.brandName,
        tagline: input.tagline,
      },
    });

    if (gen) {
      await updateGeneration(gen.id, {
        status: "succeeded",
        output: { asset_id: asset.id },
        latency_ms: Date.now() - start,
        completed_at: new Date().toISOString(),
      });
    }
    await logUsage({
      user_id: user.userId,
      generation_id: gen?.id ?? null,
      kind: "flyer",
      model: OPENAI_IMAGE_MODEL,
      credits,
      cost_usd: cost.rawCostUsd,
    });

    return NextResponse.json({
      ok: true,
      asset,
      remaining: balance.remaining,
    });
  } catch (err) {
    console.error("[/api/ai/flyer] failed", err);
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

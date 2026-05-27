import { NextResponse, type NextRequest } from "next/server";

import { generateImage, OPENAI_IMAGE_MODEL } from "@/lib/ai/openai";
import { buildImagePrompt } from "@/lib/ai/prompts";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createGeneration, updateGeneration } from "@/lib/db/generations";
import { createAsset } from "@/lib/db/assets";
import { deductCredits, logUsage, refundCredits } from "@/lib/db/usage";
import { creditsFor, costFor } from "@/lib/credits";
import { ImageRequestSchema } from "@/lib/validators";
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
  const parsed = ImageRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const credits = creditsFor("image", input.n);
  const balance = await deductCredits(user.userId, credits);
  if (!balance.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", remaining: balance.remaining },
      { status: 402 }
    );
  }

  const finalPrompt = buildImagePrompt({
    prompt: input.prompt,
    scene: input.scene,
    product: input.product,
    brandColors: {
      primary: input.primaryColor,
      accent: input.accentColor,
    },
  });

  const gen = await createGeneration({
    user_id: user.userId,
    project_id: input.projectId ?? null,
    kind: "image",
    provider: "openai",
    model: OPENAI_IMAGE_MODEL,
    prompt: { ...input, finalPrompt },
    credits_cost: credits,
    status: "processing",
  });

  const start = Date.now();
  try {
    const size = ASPECT_TO_OPENAI_SIZE[input.aspect as AspectRatio];
    const { b64Images } = await generateImage({
      prompt: finalPrompt,
      size,
      quality: input.quality,
      n: input.n,
    });

    if (b64Images.length === 0) {
      throw new Error("OpenAI returned no images");
    }

    const assets = [];
    for (let i = 0; i < b64Images.length; i++) {
      const buffer = Buffer.from(b64Images[i], "base64");
      const path = `images/${gen?.id ?? Date.now()}-${i}.png`;
      const upload = await uploadToAssets({
        userId: user.userId,
        path,
        body: buffer,
        contentType: "image/png",
      });
      const fileUrl =
        upload?.publicUrl ?? `data:image/png;base64,${b64Images[i]}`;
      const asset = await createAsset(user.userId, {
        project_id: input.projectId ?? null,
        type: "image",
        title: input.prompt.slice(0, 80),
        file_url: fileUrl,
        thumbnail_url: fileUrl,
        mime_type: "image/png",
        generation_id: gen?.id ?? null,
        metadata: {
          aspect: input.aspect,
          quality: input.quality,
          size,
          prompt: finalPrompt,
        },
      });
      assets.push(asset);
    }

    if (gen) {
      await updateGeneration(gen.id, {
        status: "succeeded",
        output: { asset_ids: assets.map((a) => a.id) },
        latency_ms: Date.now() - start,
        completed_at: new Date().toISOString(),
      });
    }
    await logUsage({
      user_id: user.userId,
      generation_id: gen?.id ?? null,
      kind: "image",
      model: OPENAI_IMAGE_MODEL,
      credits,
      cost_usd: costFor("image", input.n),
      metadata: { aspect: input.aspect },
    });

    return NextResponse.json({
      ok: true,
      assets,
      remaining: balance.remaining,
    });
  } catch (err) {
    console.error("[/api/ai/image] failed", err);
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

import { NextResponse, type NextRequest } from "next/server";

import { generateCopy, OPENAI_TEXT_MODEL } from "@/lib/ai/openai";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createGeneration, updateGeneration } from "@/lib/db/generations";
import { createAsset } from "@/lib/db/assets";
import { deductCredits, logUsage, refundCredits } from "@/lib/db/usage";
import { COPY_KIND_LABELS } from "@/lib/ai/prompts";
import { creditsFor, costFor } from "@/lib/credits";
import { CopyRequestSchema } from "@/lib/validators";
import { PLATFORMS } from "@/lib/platform-presets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = CopyRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const credits = creditsFor("copy", input.count ?? 5);

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
    kind: "copy",
    provider: "openai",
    model: OPENAI_TEXT_MODEL,
    prompt: input,
    credits_cost: credits,
    status: "processing",
  });

  const start = Date.now();
  try {
    const { items } = await generateCopy({
      platform: input.platform,
      kind: input.kind,
      product: input.product,
      audience: input.audience,
      brandVoice: input.brandVoice,
      count: input.count,
      extras: input.extras,
    });

    const title = `${COPY_KIND_LABELS[input.kind]} · ${PLATFORMS[input.platform].label}`;
    const asset = await createAsset(user.userId, {
      project_id: input.projectId ?? null,
      type: "copy",
      title,
      content: { kind: input.kind, platform: input.platform, items },
      generation_id: gen?.id ?? null,
      metadata: { product: input.product },
    });

    if (gen) {
      await updateGeneration(gen.id, {
        status: "succeeded",
        output: { items, asset_id: asset.id },
        latency_ms: Date.now() - start,
        completed_at: new Date().toISOString(),
      });
    }
    await logUsage({
      user_id: user.userId,
      generation_id: gen?.id ?? null,
      kind: "copy",
      model: OPENAI_TEXT_MODEL,
      credits,
      cost_usd: costFor("copy", input.count ?? 5),
    });

    return NextResponse.json({
      ok: true,
      items,
      asset,
      remaining: balance.remaining,
    });
  } catch (err) {
    console.error("[/api/ai/copy] failed", err);
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

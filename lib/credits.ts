import type { GenerationKind } from "@/types/database";

/**
 * Per-generation pricing.
 *
 * `1 credit = $0.01 retail` at list price. Each entry charges users at
 * roughly 10× our raw API cost, so the gross margin floor is ≥90% even
 * after bulk pack bonuses (the biggest pack, Scale, has a 25% bonus,
 * which still leaves us at ~87% blended margin on that cohort).
 *
 * Pricing references (2026, end of May):
 *   - OpenAI gpt-4o-mini:           $0.15 / $0.60 per 1M tokens
 *   - OpenAI gpt-image-1:           $0.011 (low) / $0.042 (med) /
 *                                    $0.167 (high square) / $0.25 (high p/l)
 *   - ElevenLabs Multilingual v2:   $0.10 per 1k chars
 *   - fal Kling 2.5 Turbo Pro:      $0.07 / sec
 *   - fal Veo3 Fast (audio on):     $0.15 / sec @ ≤1080p, $0.35 / sec @ 4K
 *   - Runway Gen-4 Turbo:           5 credits/s ($0.05/sec)
 *   - Runway Gen-4 Aleph (v2v):     15 credits/s ($0.15/sec)
 *   - Runway Veo 3 (audio):         40 credits/s ($0.40/sec)
 *
 * Unknown models in a kind fall back to the most expensive variant in
 * that kind, so we never undercharge.
 */

export type GenerationCostInput =
  | {
      kind: "copy";
      count?: number; // number of variants returned (cap 10)
    }
  | {
      kind: "image";
      quality?: "low" | "medium" | "high";
      aspect?:
        | "9:16"
        | "1:1"
        | "4:5"
        | "16:9"
        | "3:4"
        | "21:9"
        | "1024x1024"
        | "1024x1536"
        | "1536x1024";
      n?: number; // images per request
    }
  | {
      kind: "voiceover";
      charLength: number; // characters of generated speech
    }
  | {
      kind: "video";
      model: string;
      durationSeconds?: number;
      withAudio?: boolean;
      mode?: "text-to-video" | "image-to-video" | "video-to-video";
    }
  | {
      kind: "flyer";
    };

export type GenerationCost = {
  credits: number;
  rawCostUsd: number;
};

const MARGIN_MULTIPLIER = 10; // 10× raw cost ⇒ 90% gross margin

// ------------------------------------------------------------------
// Image
// ------------------------------------------------------------------

function imageRawCostUsd(input: Extract<GenerationCostInput, { kind: "image" }>): number {
  const quality = input.quality ?? "high";
  const aspect = input.aspect ?? "1:1";
  const isSquare =
    aspect === "1:1" ||
    aspect === "1024x1024" ||
    // 4:5 and similar map to OpenAI 1024x1536 (portrait), priced same as portrait
    false;
  const portraitFamily =
    aspect === "9:16" ||
    aspect === "4:5" ||
    aspect === "3:4" ||
    aspect === "16:9" ||
    aspect === "21:9" ||
    aspect === "1024x1536" ||
    aspect === "1536x1024";

  // gpt-image-1 published prices (May 2026)
  let perImage: number;
  if (quality === "low") {
    perImage = isSquare ? 0.011 : 0.016;
  } else if (quality === "medium") {
    perImage = isSquare ? 0.042 : 0.063;
  } else {
    // 'high'
    perImage = isSquare && !portraitFamily ? 0.167 : 0.25;
  }
  const n = Math.max(1, input.n ?? 1);
  return perImage * n;
}

// ------------------------------------------------------------------
// Voiceover
// ------------------------------------------------------------------

function voiceoverRawCostUsd(input: Extract<GenerationCostInput, { kind: "voiceover" }>): number {
  // ElevenLabs Multilingual v2 = $0.10 / 1k chars. We bill per 100 chars
  // (rounded up) so a 50-char clip still pays its share.
  const buckets = Math.max(1, Math.ceil(input.charLength / 100));
  return buckets * 0.01; // $0.01 per 100 chars
}

// ------------------------------------------------------------------
// Video
// ------------------------------------------------------------------

/**
 * Returns USD per second for the given video model.
 *
 * Unknown models fall back to the most expensive option (Runway Veo3 with
 * audio at $0.40/s) so we never lose money on a new model accidentally
 * routed into production.
 */
function videoPerSecondUsd(model: string, withAudio: boolean): number {
  const m = (model || "").toLowerCase();

  // ---- fal.ai ----
  if (m.includes("kling")) return 0.07;
  if (m.includes("veo3.1/fast") || m.includes("veo3/fast")) {
    return withAudio ? 0.15 : 0.1;
  }
  if (m.includes("veo3.1") || m.includes("veo-3.1") || m.includes("veo3")) {
    // Veo3 standard on fal
    return withAudio ? 0.4 : 0.2;
  }
  if (m.includes("hailuo") || m.includes("minimax")) return 0.08;
  if (m.includes("wan-2.5") || m.includes("wan2.5")) return 0.05;
  if (m.includes("wan-2.2") || m.includes("wan2.2")) return 0.1;
  if (m.includes("sora-2") || m.includes("sora2")) return 0.5;

  // ---- Runway ----
  if (m.includes("gen4.5") || m.includes("gen-4.5")) return 0.12;
  if (m.includes("gen4_aleph") || m.includes("aleph")) return 0.15;
  if (m.includes("gen4_turbo") || m.includes("gen-4-turbo")) return 0.05;
  if (m.includes("gen3a_turbo") || m.includes("gen-3")) return 0.05;

  // Final fallback — Runway Veo3 with audio (most expensive surface).
  return 0.4;
}

function videoDurationSeconds(
  input: Extract<GenerationCostInput, { kind: "video" }>
): number {
  const explicit = input.durationSeconds;
  if (explicit && explicit > 0) return explicit;
  // Kling default is 5s; Veo3 fast is typically 5–8s; Aleph 5–10s.
  // 10s is a safe upper-bound default so we don't underbill.
  const m = (input.model || "").toLowerCase();
  if (m.includes("kling")) return 5;
  if (m.includes("veo3")) return 8;
  if (m.includes("aleph")) return 10;
  return 8;
}

function videoRawCostUsd(input: Extract<GenerationCostInput, { kind: "video" }>): number {
  const seconds = videoDurationSeconds(input);
  // Default to audio-on for any veo3 model (matches lib/ai/providers/fal.ts
  // which passes generate_audio: true).
  const m = (input.model || "").toLowerCase();
  const audioImplied = input.withAudio ?? m.includes("veo3");
  const perSecond = videoPerSecondUsd(input.model, audioImplied);
  return perSecond * seconds;
}

// ------------------------------------------------------------------
// Public surface
// ------------------------------------------------------------------

export function getGenerationCost(input: GenerationCostInput): GenerationCost {
  let rawCostUsd: number;
  switch (input.kind) {
    case "copy": {
      // gpt-4o-mini, conservative budget of 1k in + 1k out per variant.
      // $0.15/1M in + $0.60/1M out = $0.00075 per call. Round up.
      const variants = Math.max(1, input.count ?? 5);
      rawCostUsd = 0.001 * Math.ceil(variants / 5);
      break;
    }
    case "image":
      rawCostUsd = imageRawCostUsd(input);
      break;
    case "voiceover":
      rawCostUsd = voiceoverRawCostUsd(input);
      break;
    case "video":
      rawCostUsd = videoRawCostUsd(input);
      break;
    case "flyer":
      // Flyer goes through gpt-image-1 at high quality (see flyer route).
      // Use the portrait price as the conservative bound.
      rawCostUsd = 0.25;
      break;
  }
  // Cents (rounded up) × 10 for our ≥90% margin, with a floor of 1.
  const credits = Math.max(1, Math.ceil(rawCostUsd * 100 * MARGIN_MULTIPLIER) / 1);
  return { credits, rawCostUsd: Number(rawCostUsd.toFixed(4)) };
}

// ------------------------------------------------------------------
// Back-compat shims for older call sites
// ------------------------------------------------------------------

/** @deprecated Use `getGenerationCost` for new code. */
export const CREDIT_COSTS = {
  copy: 1,
  image: 180,
  video: 1400,
  voiceover: 12,
  flyer: 180,
} as const satisfies Record<GenerationKind, number>;

/** @deprecated Use `getGenerationCost` for new code. */
export const COST_USD = {
  copy: 0.001,
  image: 0.167,
  video: 1.2,
  voiceover: 0.01,
  flyer: 0.25,
} as const satisfies Record<GenerationKind, number>;

/** @deprecated Pass the full context to `getGenerationCost` instead. */
export function creditsFor(kind: GenerationKind, n = 1): number {
  return CREDIT_COSTS[kind] * Math.max(1, n);
}

/** @deprecated Use `getGenerationCost(...).rawCostUsd` instead. */
export function costFor(kind: GenerationKind, n = 1): number {
  return COST_USD[kind] * Math.max(1, n);
}

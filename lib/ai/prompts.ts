import { PLATFORMS, type Platform } from "@/lib/platform-presets";

export type CopyKind = "hook" | "caption" | "headline" | "cta" | "script";

export const COPY_KIND_LABELS: Record<CopyKind, string> = {
  hook: "Hooks",
  caption: "Captions",
  headline: "Headlines",
  cta: "CTAs",
  script: "Scripts",
};

export type CopyRequest = {
  platform: Platform;
  kind: CopyKind;
  product: string;
  audience?: string;
  brandVoice?: string;
  count?: number;
  extras?: string;
};

export function buildCopySystemPrompt(): string {
  return `You are AIV, a senior brand copywriter who writes editorial, conversion-driven content for founders.
You write tight, punchy, and human copy. Never sound like a chatbot. Avoid clichés.
You always return STRICT JSON in the exact shape requested. No prose, no markdown, no commentary.`;
}

export function buildCopyUserPrompt(req: CopyRequest): string {
  const platform = PLATFORMS[req.platform];
  const count = Math.max(1, Math.min(req.count ?? 5, 10));
  const kindGuide: Record<CopyKind, string> = {
    hook:
      "Each hook is one line, max 12 words, designed to stop the scroll on the first second. No emoji unless it earns the slot.",
    caption:
      "Each caption is 2-4 short lines with a single CTA. Include 3-6 hashtags only when on a hashtag-driven platform.",
    headline:
      "Each headline is one line, under 8 words, written for an ad creative or thumbnail.",
    cta:
      "Each CTA is one short imperative phrase, under 6 words, action-led.",
    script:
      "Each script is a 15-30 second voiceover script. Use plain text with line breaks. Open with a hook line, then 2-3 beats, then a CTA.",
  };

  const audience = req.audience?.trim()
    ? `Target audience: ${req.audience.trim()}.`
    : "Target audience: broad consumer.";
  const voice = req.brandVoice?.trim()
    ? `Brand voice: ${req.brandVoice.trim()}.`
    : `Brand voice: ${platform.voice}.`;
  const extras = req.extras?.trim() ? `Additional notes: ${req.extras.trim()}` : "";

  return `Generate exactly ${count} ${req.kind}(s) for ${platform.label}.

Product / offer: ${req.product}
${audience}
${voice}
Platform notes: ${platform.notes}
Format guidance: ${kindGuide[req.kind]}
${extras}

Return JSON in this exact shape and nothing else:
{
  "items": [
    "string"
  ]
}`;
}

export type ImagePromptInput = {
  prompt: string;
  scene?: string;
  brandColors?: { primary?: string; accent?: string };
  product?: string;
};

export function buildImagePrompt(input: ImagePromptInput): string {
  const parts: string[] = [];
  if (input.scene) parts.push(`Scene: ${input.scene}.`);
  if (input.product) parts.push(`Subject: ${input.product}.`);
  parts.push(input.prompt);
  if (input.brandColors?.primary) {
    parts.push(`Primary brand color ${input.brandColors.primary}.`);
  }
  if (input.brandColors?.accent) {
    parts.push(`Accent color ${input.brandColors.accent}.`);
  }
  parts.push(
    "Editorial lighting, sharp commercial photography, high detail, luxurious composition, clean background."
  );
  return parts.join(" ");
}

export type VideoRemixBrand = {
  name?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  hasLogo?: boolean;
};

/**
 * Build a strong video-to-video prompt for re-rendering a reference clip
 * with the user's branding. Designed to bias the model toward *structure
 * and pacing* of the source while replacing identifying details with the
 * user's brand — keeping us on the right side of "inspired by" rather than
 * a 1:1 reskin.
 */
export function buildVideoRemixPrompt(input: {
  userPrompt?: string;
  brand?: VideoRemixBrand;
}): string {
  const lines: string[] = [];
  lines.push(
    "Re-render this reference video with the brand identity below. Match the original's pacing, framing, and motion, but swap product, on-screen text, and color treatment to match the brand."
  );

  const brand = input.brand;
  if (brand?.name) lines.push(`Brand name on screen: ${brand.name}.`);
  if (brand?.hasLogo)
    lines.push(
      "Composite the user's logo as a small bug in a clean corner; it must remain crisp and readable on every frame."
    );
  if (brand?.primaryColor)
    lines.push(`Primary brand color ${brand.primaryColor}.`);
  if (brand?.accentColor) lines.push(`Accent color ${brand.accentColor}.`);
  if (brand?.fontFamily)
    lines.push(`On-screen typography: ${brand.fontFamily}-style.`);

  if (input.userPrompt && input.userPrompt.trim().length > 0) {
    lines.push(`Creative direction: ${input.userPrompt.trim()}`);
  }

  lines.push(
    "Keep the look premium and editorial. Do not reproduce identifying faces, logos, or trademarks from the source — replace them with the brand above."
  );
  return lines.join(" ");
}

export function buildFlyerPrompt(input: {
  type: "business_card" | "flyer";
  prompt: string;
  brand?: { name?: string; tagline?: string; colors?: { primary?: string; accent?: string }; font?: string };
}): string {
  const t =
    input.type === "business_card"
      ? "luxury minimal business card design, front view, embossed feel, premium paper, high resolution"
      : "high-end marketing flyer poster design, balanced layout, hero subject, clear hierarchy, premium printable";
  const lines = [t];
  if (input.brand?.name) lines.push(`Brand name: ${input.brand.name}.`);
  if (input.brand?.tagline) lines.push(`Tagline: ${input.brand.tagline}.`);
  if (input.brand?.colors?.primary) lines.push(`Primary color ${input.brand.colors.primary}.`);
  if (input.brand?.colors?.accent) lines.push(`Accent color ${input.brand.colors.accent}.`);
  if (input.brand?.font) lines.push(`Typography: ${input.brand.font}-style.`);
  lines.push(input.prompt);
  lines.push(
    "Avoid Lorem Ipsum. Use realistic, on-brand placeholder copy. Sharp, editorial, gallery-worthy."
  );
  return lines.join(" ");
}

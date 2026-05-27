import { z } from "zod";

export const PlatformSchema = z.enum([
  "tiktok",
  "instagram",
  "facebook",
  "youtube",
]);

export const CopyKindSchema = z.enum([
  "hook",
  "caption",
  "headline",
  "cta",
  "script",
]);

export const AspectRatioSchema = z.enum([
  "9:16",
  "1:1",
  "4:5",
  "16:9",
  "3:4",
  "21:9",
]);

export const CopyRequestSchema = z.object({
  platform: PlatformSchema,
  kind: CopyKindSchema,
  product: z.string().min(2).max(800),
  audience: z.string().max(300).optional(),
  brandVoice: z.string().max(300).optional(),
  count: z.number().int().min(1).max(10).optional(),
  extras: z.string().max(500).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const ImageRequestSchema = z.object({
  prompt: z.string().min(2).max(2000),
  scene: z.string().max(200).optional(),
  product: z.string().max(200).optional(),
  primaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  aspect: AspectRatioSchema.default("1:1"),
  quality: z.enum(["low", "medium", "high"]).default("high"),
  n: z.number().int().min(1).max(2).default(1),
  projectId: z.string().uuid().nullable().optional(),
});

export const VideoRequestSchema = z.object({
  mode: z.enum(["text-to-video", "image-to-video", "video-to-video"]),
  prompt: z.string().min(2).max(2000),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  durationSeconds: z.number().int().min(1).max(20).optional(),
  model: z.string().optional(),
  provider: z.enum(["fal", "runway"]).optional(),
  parentAssetId: z.string().uuid().nullable().optional(),
  lineageId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  brandKitId: z.string().uuid().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
});

/**
 * URL → playable MP4 in our storage.
 * Accepts a direct video URL (mp4/webm/mov) or a social platform URL
 * (TikTok / Instagram / YouTube / X / Facebook). Platform URLs require
 * VIDEO_INGEST_PROVIDER to be configured server-side.
 */
export const VideoIngestRequestSchema = z.object({
  url: z.string().url(),
});

export const FlyerRequestSchema = z.object({
  type: z.enum(["business_card", "flyer"]),
  prompt: z.string().min(2).max(2000),
  brandName: z.string().max(120).optional(),
  tagline: z.string().max(200).optional(),
  primaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  fontFamily: z.string().max(120).optional(),
  logoUrl: z.string().url().nullable().optional(),
  aspect: AspectRatioSchema.default("4:5"),
  projectId: z.string().uuid().nullable().optional(),
});

export const VoiceoverRequestSchema = z.object({
  text: z.string().min(2).max(5000),
  voiceId: z.string().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export type CopyRequestInput = z.infer<typeof CopyRequestSchema>;
export type ImageRequestInput = z.infer<typeof ImageRequestSchema>;
export type VideoRequestInput = z.infer<typeof VideoRequestSchema>;
export type VideoIngestRequestInput = z.infer<typeof VideoIngestRequestSchema>;
export type FlyerRequestInput = z.infer<typeof FlyerRequestSchema>;
export type VoiceoverRequestInput = z.infer<typeof VoiceoverRequestSchema>;

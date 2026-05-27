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
  mode: z.enum(["text-to-video", "image-to-video"]),
  prompt: z.string().min(2).max(2000),
  imageUrl: z.string().url().nullable().optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  durationSeconds: z.number().int().min(1).max(20).optional(),
  model: z.string().optional(),
  projectId: z.string().uuid().nullable().optional(),
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
export type FlyerRequestInput = z.infer<typeof FlyerRequestSchema>;
export type VoiceoverRequestInput = z.infer<typeof VoiceoverRequestSchema>;

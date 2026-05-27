import "server-only";

import * as fal from "./providers/fal";
import * as runway from "./providers/runway";

export type VideoMode = "text-to-video" | "image-to-video" | "video-to-video";
export type VideoProviderName = "fal" | "runway";

export type VideoGenerateInput = {
  mode: VideoMode;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  durationSeconds?: number;
  model?: string;
};

export type VideoSubmitResult = {
  externalId: string;
  provider: string;
  model: string;
};

export type VideoStatus = {
  status: "queued" | "processing" | "succeeded" | "failed";
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  error?: string | null;
};

export interface VideoProvider {
  readonly name: string;
  submit(input: VideoGenerateInput): Promise<VideoSubmitResult>;
  status(externalId: string, model: string): Promise<VideoStatus>;
}

/**
 * Resolve a video provider. Explicit `override` wins; otherwise we honor
 * VIDEO_PROVIDER env, then prefer Runway if a RUNWAY_API_KEY is set.
 */
export function getVideoProvider(
  override?: VideoProviderName | null
): VideoProvider {
  const explicit = (override ?? process.env.VIDEO_PROVIDER ?? "").toLowerCase();
  if (explicit === "runway") return runway as unknown as VideoProvider;
  if (explicit === "fal") return fal as unknown as VideoProvider;
  if (process.env.RUNWAY_API_KEY) return runway as unknown as VideoProvider;
  return fal as unknown as VideoProvider;
}

export function defaultVideoProviderName(): VideoProviderName {
  const env = (process.env.VIDEO_PROVIDER ?? "").toLowerCase();
  if (env === "runway") return "runway";
  if (env === "fal") return "fal";
  return process.env.RUNWAY_API_KEY ? "runway" : "fal";
}

export const DEFAULT_VIDEO_MODEL =
  process.env.DEFAULT_VIDEO_MODEL ??
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

export const DEFAULT_TEXT_VIDEO_MODEL =
  process.env.DEFAULT_TEXT_VIDEO_MODEL ?? "fal-ai/veo3/fast";

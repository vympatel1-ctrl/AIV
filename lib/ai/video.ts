import "server-only";

import * as fal from "./providers/fal";
import * as runway from "./providers/runway";

export type VideoMode = "text-to-video" | "image-to-video";

export type VideoGenerateInput = {
  mode: VideoMode;
  prompt: string;
  imageUrl?: string;
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

export function getVideoProvider(): VideoProvider {
  const name = (process.env.VIDEO_PROVIDER ?? "fal").toLowerCase();
  switch (name) {
    case "runway":
      return runway as unknown as VideoProvider;
    case "fal":
    default:
      return fal as unknown as VideoProvider;
  }
}

export const DEFAULT_VIDEO_MODEL =
  process.env.DEFAULT_VIDEO_MODEL ??
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

export const DEFAULT_TEXT_VIDEO_MODEL =
  process.env.DEFAULT_TEXT_VIDEO_MODEL ?? "fal-ai/kling-video/v2.5-turbo/pro";

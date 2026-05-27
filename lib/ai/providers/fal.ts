import "server-only";

import { fal } from "@fal-ai/client";

import type {
  VideoGenerateInput,
  VideoStatus,
  VideoSubmitResult,
} from "../video";

export const name = "fal";

let configured = false;
function configureOnce() {
  if (configured) return;
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is not set");
  }
  fal.config({ credentials: process.env.FAL_KEY });
  configured = true;
}

function pickModel(input: VideoGenerateInput): string {
  if (input.model) return input.model;
  if (input.mode === "image-to-video") {
    return (
      process.env.DEFAULT_VIDEO_MODEL ??
      "fal-ai/kling-video/v2.5-turbo/pro/image-to-video"
    );
  }
  return (
    process.env.DEFAULT_TEXT_VIDEO_MODEL ??
    "fal-ai/kling-video/v2.5-turbo/pro"
  );
}

function buildInput(input: VideoGenerateInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
  };
  if (input.aspectRatio) payload.aspect_ratio = input.aspectRatio;
  if (input.durationSeconds) payload.duration = input.durationSeconds;
  if (input.mode === "image-to-video" && input.imageUrl) {
    payload.image_url = input.imageUrl;
  }
  return payload;
}

export async function submit(
  input: VideoGenerateInput
): Promise<VideoSubmitResult> {
  configureOnce();
  const model = pickModel(input);
  const enq = await fal.queue.submit(model, {
    input: buildInput(input),
  });
  return {
    externalId: enq.request_id,
    provider: "fal",
    model,
  };
}

export async function status(
  externalId: string,
  model: string
): Promise<VideoStatus> {
  configureOnce();
  const s = await fal.queue.status(model, {
    requestId: externalId,
    logs: false,
  });

  if (s.status === "IN_QUEUE") {
    return { status: "queued" };
  }
  if (s.status === "IN_PROGRESS") {
    return { status: "processing" };
  }
  if (s.status === "COMPLETED") {
    try {
      const result = await fal.queue.result(model, { requestId: externalId });
      const data = result.data as
        | { video?: { url?: string }; image?: { url?: string } }
        | undefined;
      return {
        status: "succeeded",
        videoUrl: data?.video?.url ?? null,
        thumbnailUrl: data?.image?.url ?? null,
      };
    } catch (err) {
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "Failed to fetch result",
      };
    }
  }
  return { status: "failed", error: "Unknown status" };
}

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

const DEFAULT_IMAGE_MODEL =
  process.env.DEFAULT_VIDEO_MODEL ??
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
const DEFAULT_TEXT_MODEL =
  process.env.DEFAULT_TEXT_VIDEO_MODEL ?? "fal-ai/veo3/fast";

function pickModel(input: VideoGenerateInput): string {
  if (input.model) return input.model;
  return input.mode === "image-to-video"
    ? DEFAULT_IMAGE_MODEL
    : DEFAULT_TEXT_MODEL;
}

/**
 * Different fal models accept different input shapes. Build per-model.
 */
function buildInput(
  model: string,
  input: VideoGenerateInput
): Record<string, unknown> {
  const m = model.toLowerCase();
  const aspect = input.aspectRatio ?? "16:9";

  // Veo3 family (text-to-video; duration fixed; aspect_ratio supported)
  if (m.includes("veo3")) {
    return {
      prompt: input.prompt,
      aspect_ratio: aspect,
      resolution: "720p",
      generate_audio: true,
    };
  }

  // Kling v2.x — accepts aspect_ratio and duration as a string ("5" | "10")
  if (m.includes("kling-video")) {
    const dur = input.durationSeconds && input.durationSeconds >= 8 ? "10" : "5";
    const payload: Record<string, unknown> = {
      prompt: input.prompt,
      aspect_ratio: aspect,
      duration: dur,
    };
    if (input.mode === "image-to-video" && input.imageUrl) {
      payload.image_url = input.imageUrl;
    }
    return payload;
  }

  // Hailuo / Minimax style
  if (m.includes("minimax") || m.includes("hailuo")) {
    return {
      prompt: input.prompt,
      duration: input.durationSeconds && input.durationSeconds >= 8 ? "10" : "6",
      ...(input.mode === "image-to-video" && input.imageUrl
        ? { first_frame_image: input.imageUrl }
        : {}),
    };
  }

  // Generic fallback
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: aspect,
  };
  if (input.durationSeconds) payload.duration = input.durationSeconds;
  if (input.mode === "image-to-video" && input.imageUrl) {
    payload.image_url = input.imageUrl;
  }
  return payload;
}

export async function submit(
  input: VideoGenerateInput
): Promise<VideoSubmitResult> {
  if (input.mode === "video-to-video") {
    throw new Error(
      "Video-to-video iteration is only available with the Runway provider. Set VIDEO_PROVIDER=runway."
    );
  }
  configureOnce();
  const model = pickModel(input);
  try {
    const enq = await fal.queue.submit(model, { input: buildInput(model, input) });
    return { externalId: enq.request_id, provider: "fal", model };
  } catch (err) {
    console.error("[fal.submit] failed", { model, err });
    const detail = (err as { body?: { detail?: unknown }; message?: string })
      ?.body?.detail;
    const detailString = detail
      ? typeof detail === "string"
        ? detail
        : JSON.stringify(detail).slice(0, 500)
      : (err as Error)?.message;
    throw new Error(`fal.ai rejected request (${model}): ${detailString}`);
  }
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
        | {
            video?: { url?: string };
            image?: { url?: string };
            video_url?: string;
          }
        | undefined;
      const videoUrl = data?.video?.url ?? data?.video_url ?? null;
      return {
        status: "succeeded",
        videoUrl,
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

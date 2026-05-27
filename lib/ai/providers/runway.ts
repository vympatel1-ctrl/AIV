import "server-only";

import RunwayML from "@runwayml/sdk";

import type {
  VideoGenerateInput,
  VideoStatus,
  VideoSubmitResult,
} from "../video";

export const name = "runway";

let _client: RunwayML | null = null;
function getClient() {
  if (!process.env.RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY is not set");
  }
  if (!_client) {
    _client = new RunwayML({ apiKey: process.env.RUNWAY_API_KEY });
  }
  return _client;
}

type Gen4TurboRatio =
  | "1280:720"
  | "720:1280"
  | "1104:832"
  | "832:1104"
  | "960:960"
  | "1584:672";

type Veo3Ratio = "1280:720" | "720:1280" | "1080:1920" | "1920:1080";

function toGen4Ratio(aspect?: VideoGenerateInput["aspectRatio"]): Gen4TurboRatio {
  switch (aspect) {
    case "9:16":
      return "720:1280";
    case "1:1":
      return "960:960";
    case "16:9":
    default:
      return "1280:720";
  }
}

function toVeo3Ratio(aspect?: VideoGenerateInput["aspectRatio"]): Veo3Ratio {
  switch (aspect) {
    case "9:16":
      return "720:1280";
    case "16:9":
    default:
      return "1280:720";
  }
}

function clampGen4Duration(seconds?: number): 5 | 10 {
  if (!seconds) return 5;
  return seconds >= 8 ? 10 : 5;
}

export async function submit(
  input: VideoGenerateInput
): Promise<VideoSubmitResult> {
  const client = getClient();

  if (input.mode === "video-to-video") {
    if (!input.videoUrl) {
      throw new Error("Runway video-to-video requires a videoUrl");
    }
    const task = await client.videoToVideo.create({
      model: "gen4_aleph",
      promptText: input.prompt,
      videoUri: input.videoUrl,
      ratio: toGen4Ratio(input.aspectRatio),
    });
    return { externalId: task.id, provider: "runway", model: "gen4_aleph" };
  }

  if (input.mode === "text-to-video") {
    const task = await client.textToVideo.create({
      model: "veo3",
      promptText: input.prompt,
      ratio: toVeo3Ratio(input.aspectRatio),
      duration: 8,
    });
    return { externalId: task.id, provider: "runway", model: "veo3" };
  }

  if (!input.imageUrl) {
    throw new Error("Runway image-to-video requires an imageUrl");
  }

  const task = await client.imageToVideo.create({
    model: "gen4_turbo",
    promptImage: input.imageUrl,
    promptText: input.prompt,
    ratio: toGen4Ratio(input.aspectRatio),
    duration: clampGen4Duration(input.durationSeconds),
  });
  return { externalId: task.id, provider: "runway", model: "gen4_turbo" };
}

export async function status(
  externalId: string,
  _model: string
): Promise<VideoStatus> {
  const client = getClient();
  const task = await client.tasks.retrieve(externalId);

  switch (task.status) {
    case "PENDING":
    case "THROTTLED":
      return { status: "queued" };
    case "RUNNING":
      return { status: "processing" };
    case "SUCCEEDED": {
      const url = Array.isArray(task.output) ? task.output[0] : null;
      return { status: "succeeded", videoUrl: url, thumbnailUrl: null };
    }
    case "FAILED":
      return {
        status: "failed",
        error: task.failure ?? "Generation failed",
      };
    case "CANCELLED":
      return { status: "failed", error: "Cancelled" };
    default:
      return { status: "processing" };
  }
}

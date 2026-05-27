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

const MODEL_DEFAULT = "gen4_turbo";

type RunwayRatio = "1280:720" | "720:1280" | "1104:832" | "960:960" | "832:1104" | "1584:672";

function mapAspectToRatio(aspect?: VideoGenerateInput["aspectRatio"]): RunwayRatio {
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

function clampDuration(seconds?: number): 5 | 10 {
  if (!seconds) return 5;
  return seconds >= 8 ? 10 : 5;
}

export async function submit(
  input: VideoGenerateInput
): Promise<VideoSubmitResult> {
  const client = getClient();
  const model = (input.model ?? MODEL_DEFAULT) as "gen4_turbo";
  const ratio = mapAspectToRatio(input.aspectRatio);
  const duration = clampDuration(input.durationSeconds);

  if (input.mode === "text-to-video") {
    const task = await client.textToVideo.create({
      model: "veo3" as never,
      promptText: input.prompt,
      ratio: ratio === "960:960" ? "1280:720" : (ratio as never),
      duration: duration === 10 ? 8 : duration,
    } as never);
    return { externalId: task.id, provider: "runway", model: "veo3" };
  }

  if (!input.imageUrl) {
    throw new Error("Runway image-to-video requires imageUrl");
  }

  const task = await client.imageToVideo.create({
    model,
    promptImage: input.imageUrl,
    promptText: input.prompt,
    ratio,
    duration,
  });
  return { externalId: task.id, provider: "runway", model };
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
      return {
        status: "succeeded",
        videoUrl: url,
        thumbnailUrl: null,
      };
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

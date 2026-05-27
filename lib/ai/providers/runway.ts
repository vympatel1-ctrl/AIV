import "server-only";

import type {
  VideoGenerateInput,
  VideoStatus,
  VideoSubmitResult,
} from "../video";

/**
 * Runway provider stub. The fal.ai provider is the default; this exists so
 * we can swap in the official Runway API later by setting VIDEO_PROVIDER=runway.
 *
 * TODO(runway): wire to https://api.runwayml.com/ once we sign up.
 */
export const name = "runway";

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function submit(
  _input: VideoGenerateInput
): Promise<VideoSubmitResult> {
  throw new Error(
    "Runway provider is not implemented yet. Set VIDEO_PROVIDER=fal."
  );
}

export async function status(
  _externalId: string,
  _model: string
): Promise<VideoStatus> {
  throw new Error(
    "Runway provider is not implemented yet. Set VIDEO_PROVIDER=fal."
  );
}
/* eslint-enable @typescript-eslint/no-unused-vars */

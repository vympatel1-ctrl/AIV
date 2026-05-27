import "server-only";

import OpenAI from "openai";

import {
  buildCopySystemPrompt,
  buildCopyUserPrompt,
  type CopyRequest,
} from "./prompts";

let _client: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export const OPENAI_TEXT_MODEL =
  process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";
export const OPENAI_IMAGE_MODEL =
  process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

/**
 * Generate ad copy items as a string array.
 * Uses JSON mode for structured output.
 */
export async function generateCopy(req: CopyRequest): Promise<{
  items: string[];
  raw: string;
}> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.85,
    messages: [
      { role: "system", content: buildCopySystemPrompt() },
      { role: "user", content: buildCopyUserPrompt(req) },
    ],
  });
  const content = completion.choices[0]?.message.content ?? "{}";
  let parsed: { items?: string[] } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { items: [] };
  }
  const items = Array.isArray(parsed.items)
    ? parsed.items.filter((x): x is string => typeof x === "string")
    : [];
  return { items, raw: content };
}

/**
 * Generate an image with `gpt-image-1`. Returns a base64-encoded PNG.
 */
export async function generateImage(input: {
  prompt: string;
  size?: string;
  quality?: "low" | "medium" | "high" | "auto";
  background?: "transparent" | "opaque" | "auto";
  n?: number;
}): Promise<{ b64Images: string[]; revisedPrompt?: string }> {
  const openai = getOpenAI();
  const result = await openai.images.generate({
    model: OPENAI_IMAGE_MODEL,
    prompt: input.prompt,
    size: input.size as
      | "1024x1024"
      | "1024x1536"
      | "1536x1024"
      | "auto"
      | undefined,
    quality: (input.quality ?? "high") as
      | "low"
      | "medium"
      | "high"
      | "auto",
    n: input.n ?? 1,
    background: input.background,
  });

  const b64Images: string[] = [];
  for (const item of result.data ?? []) {
    if (item.b64_json) b64Images.push(item.b64_json);
  }
  return { b64Images };
}

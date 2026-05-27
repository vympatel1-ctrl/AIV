import "server-only";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let _client: ElevenLabsClient | null = null;
function getClient() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  if (!_client) {
    _client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return _client;
}

export const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb"; // "George"
export const DEFAULT_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

/**
 * Generate a TTS voiceover from a script. Returns the audio as a Buffer
 * (mp3) which the caller can upload to Supabase Storage or stream out.
 */
export async function generateVoiceover(input: {
  text: string;
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
}): Promise<Buffer> {
  const client = getClient();
  const voice = input.voiceId ?? DEFAULT_VOICE_ID;
  const audioStream = await client.textToSpeech.convert(voice, {
    text: input.text,
    modelId: input.modelId ?? DEFAULT_MODEL_ID,
    outputFormat: (input.outputFormat ?? "mp3_44100_128") as
      | "mp3_44100_128"
      | "mp3_44100_192"
      | "mp3_22050_32",
  });

  const chunks: Uint8Array[] = [];
  const reader = audioStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  return Buffer.from(buf);
}

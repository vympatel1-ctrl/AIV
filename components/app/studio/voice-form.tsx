"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  DownloadIcon,
  Loader2Icon,
  MicIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@/types/database";

type VoiceoverResponse = {
  ok?: boolean;
  asset?: Asset;
  remaining?: number;
  error?: string;
};

/** Curated ElevenLabs voices — override with ELEVENLABS_VOICE_ID on the server. */
const VOICE_PRESETS = [
  {
    id: "default",
    label: "Default (from server env)",
    hint: "Uses ELEVENLABS_VOICE_ID",
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    label: "George — warm narrator",
    hint: "Multilingual, steady pace",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    label: "Sarah — clear & friendly",
    hint: "Good for product explainers",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    label: "Adam — deep & confident",
    hint: "Hooks and authority lines",
  },
] as const;

export function VoiceForm({ projectId }: { projectId: string | null }) {
  const [text, setText] = useState("");
  const [voicePreset, setVoicePreset] = useState<string>("default");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [isPending, start] = useTransition();
  const [asset, setAsset] = useState<Asset | null>(null);

  function resolveVoiceId(): string | undefined {
    if (customVoiceId.trim()) return customVoiceId.trim();
    if (voicePreset === "default") return undefined;
    return voicePreset;
  }

  function submit() {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      toast.error("Paste a script or caption to read aloud.");
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/ai/voiceover", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            voiceId: resolveVoiceId(),
            projectId,
          }),
        });
        const json: VoiceoverResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        if (json.asset) setAsset(json.asset);
        toast.success("Voiceover ready.", {
          description: projectId
            ? "Saved to your project."
            : "Saved to your library.",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Script</CardTitle>
          <CardDescription>
            Paste copy from Copy Studio or write a 15–30s voiceover. ElevenLabs
            renders MP3 audio (3 credits).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="voice-text">Text to speak</Label>
            <Textarea
              id="voice-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Stop scrolling. This bag survives a monsoon and still looks boardroom-ready…"
              rows={8}
              className="font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {text.length.toLocaleString()} / 5,000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Voice</Label>
            <div className="grid gap-2">
              {VOICE_PRESETS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoicePreset(v.id)}
                  className={
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                    (voicePreset === v.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-foreground/10 hover:border-foreground/20")
                  }
                >
                  <span className="font-medium">{v.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {v.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-voice">
              Custom voice ID (optional)
            </Label>
            <Input
              id="custom-voice"
              value={customVoiceId}
              onChange={(e) => setCustomVoiceId(e.target.value)}
              placeholder="From ElevenLabs → Voices"
              className="font-mono text-xs"
            />
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            variant="ink"
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <MicIcon />
                Generate voiceover
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Preview</h2>
          {asset?.id && (
            <Link href={`/library/${asset.id}`}>
              <Button variant="ghost" size="sm">
                Open in library
              </Button>
            </Link>
          )}
        </div>

        {isPending && !asset ? (
          <Card className="p-10">
            <Skeleton className="mb-4 h-4 w-40" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ) : asset?.file_url ? (
          <Card className="overflow-hidden editorial-shadow">
            <CardContent className="flex flex-col items-center gap-6 p-10">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SparklesIcon className="size-6" />
              </div>
              <audio
                controls
                src={asset.file_url}
                className="w-full max-w-xl"
                preload="metadata"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={asset.file_url} download>
                    <DownloadIcon />
                    Download MP3
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAsset(null);
                    toast.message("Ready for another take.");
                  }}
                >
                  Generate another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-10 text-center">
            <MicIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Your MP3 will appear here. Tip: generate a{" "}
              <Link
                href="/studio/copy"
                className="text-primary underline-offset-4 hover:underline"
              >
                script in Copy Studio
              </Link>
              , then paste it here or use &ldquo;Read aloud&rdquo; on the result.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

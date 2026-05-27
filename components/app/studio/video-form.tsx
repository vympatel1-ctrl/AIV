"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  ImageIcon,
  Loader2Icon,
  PlayIcon,
  SparklesIcon,
  UploadIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type VideoStatusBody = {
  status: "queued" | "processing" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
};

export function VideoForm({ projectId }: { projectId: string | null }) {
  const [mode, setMode] = useState<"image-to-video" | "text-to-video">(
    "image-to-video"
  );
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aspect, setAspect] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [duration, setDuration] = useState(5);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoStatusBody | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!generationId) return;
    if (status?.status === "succeeded" || status?.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/video/${generationId}/status`);
        const json: VideoStatusBody = await res.json();
        setStatus(json);
        if (json.status === "succeeded") {
          toast.success("Video ready.");
          clearInterval(t);
        } else if (json.status === "failed") {
          toast.error(json.error ?? "Generation failed");
          clearInterval(t);
        }
      } catch {
        // keep polling
      }
    }, 5000);
    return () => clearInterval(t);
  }, [generationId, status?.status]);

  async function handleFile(file: File) {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      setImageUrl(json.url);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function submit() {
    if (prompt.trim().length < 2) {
      toast.error("Describe the motion / scene.");
      return;
    }
    if (mode === "image-to-video" && !imageUrl) {
      toast.error("Upload a source image first.");
      return;
    }
    setStatus(null);
    setGenerationId(null);
    startSubmit(async () => {
      try {
        const res = await fetch("/api/ai/video", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mode,
            prompt,
            imageUrl: mode === "image-to-video" ? imageUrl : undefined,
            aspectRatio: aspect,
            durationSeconds: duration,
            projectId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setGenerationId(json.generationId);
        setStatus({ status: "queued" });
        toast.message("Submitted to provider.", {
          description: "We'll poll for completion.",
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
          <CardTitle className="font-display">Brief</CardTitle>
          <CardDescription>
            Animate a product image or generate from text.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs
            value={mode}
            onValueChange={(v) =>
              setMode(v as "image-to-video" | "text-to-video")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image-to-video">
                <ImageIcon className="size-3.5" />
                Image to video
              </TabsTrigger>
              <TabsTrigger value="text-to-video">
                <SparklesIcon className="size-3.5" />
                Text to video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image-to-video" className="space-y-3">
              <Label>Source image</Label>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                {imageUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border/60">
                    <Image
                      src={imageUrl}
                      alt="Source"
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-card text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {isUploading ? (
                      <Loader2Icon className="size-5 animate-spin" />
                    ) : (
                      <UploadIcon className="size-5" />
                    )}
                    {isUploading ? "Uploading…" : "Upload image"}
                  </button>
                )}
                <Input
                  placeholder="Or paste an image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="text-to-video" />
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="prompt">Motion / scene prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Slow push-in, soft light, product turns subtly toward camera."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Aspect</Label>
              <Select
                value={aspect}
                onValueChange={(v) =>
                  setAspect(v as "9:16" | "16:9" | "1:1")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">Vertical · 9:16</SelectItem>
                  <SelectItem value="1:1">Square · 1:1</SelectItem>
                  <SelectItem value="16:9">Landscape · 16:9</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={isSubmitting || (status?.status === "processing")}
            variant="gold"
            size="lg"
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <SparklesIcon />
                Generate video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Output</h2>
          {status && (
            <Badge
              variant={
                status.status === "succeeded"
                  ? "success"
                  : status.status === "failed"
                  ? "destructive"
                  : "secondary"
              }
            >
              {status.status}
            </Badge>
          )}
        </div>

        {status?.status === "succeeded" && status.videoUrl ? (
          <Card className="overflow-hidden p-0">
            <video
              className="aspect-video w-full bg-black"
              src={status.videoUrl}
              controls
              autoPlay
              loop
              playsInline
            />
          </Card>
        ) : status?.status === "queued" ||
          status?.status === "processing" ||
          isSubmitting ? (
          <Card className="flex aspect-video items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <span>
                Provider is rendering. This typically takes 30s–3 minutes.
              </span>
            </div>
          </Card>
        ) : status?.status === "failed" ? (
          <Card className="p-8 text-center text-sm text-destructive">
            {status.error ?? "Generation failed"}
          </Card>
        ) : (
          <Card className="flex aspect-video items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <PlayIcon className="size-6" />
              <span>Generated video will appear here.</span>
            </div>
          </Card>
        )}

        {!status && (
          <Skeleton className="hidden h-1 w-full" />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  CheckIcon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
  Loader2Icon,
  PlayIcon,
  SparklesIcon,
  UploadIcon,
  Wand2Icon,
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
import { cn, formatRelative } from "@/lib/utils";

type Mode = "image-to-video" | "text-to-video" | "from-video";
type VideoProvider = "fal" | "runway";

type BrandKitOption = {
  id: string;
  name: string;
  primary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  logo_url: string | null;
};

type VideoStatusBody = {
  status: "queued" | "processing" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
  asset?: {
    id: string;
    file_url: string | null;
    title: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  };
};

type VersionMode =
  | "image-to-video"
  | "text-to-video"
  | "from-video"
  | "video-to-video";

type VideoVersion = {
  id: string;
  generationId: string | null;
  prompt: string;
  videoUrl: string;
  createdAt: string;
  mode: VersionMode;
};

export function VideoForm({
  projectId,
  defaultProvider,
  brandKits = [],
  socialIngestEnabled = false,
}: {
  projectId: string | null;
  defaultProvider: VideoProvider;
  brandKits?: BrandKitOption[];
  socialIngestEnabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("image-to-video");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sourceVideoUrl, setSourceVideoUrl] = useState("");
  const [sourceLinkInput, setSourceLinkInput] = useState("");
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [brandKitId, setBrandKitId] = useState<string>("");
  const [aspect, setAspect] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [duration, setDuration] = useState(5);
  const [provider, setProvider] = useState<VideoProvider>(defaultProvider);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  const [generationId, setGenerationId] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoStatusBody | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [lineageId, setLineageId] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Poll for the in-flight generation.
  useEffect(() => {
    if (!generationId) return;
    if (status?.status === "succeeded" || status?.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/video/${generationId}/status`);
        const json: VideoStatusBody = await res.json();
        setStatus(json);
        if (json.status === "succeeded" && json.videoUrl) {
          const newVersion: VideoVersion = {
            id: json.asset?.id ?? generationId,
            generationId,
            prompt: prompt || refinePrompt,
            videoUrl: json.videoUrl,
            createdAt: json.asset?.created_at ?? new Date().toISOString(),
            mode,
          };
          setVersions((prev) => [...prev, newVersion]);
          setActiveVersionId(newVersion.id);
          setRefinePrompt("");
          toast.success(
            versions.length === 0 ? "Video ready." : "New version ready."
          );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleVideoFile(file: File) {
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video too large (max 200 MB).");
      return;
    }
    setIsUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      setSourceVideoUrl(json.url);
      setSourceLabel(file.name);
      toast.success("Video uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingVideo(false);
    }
  }

  async function ingestSourceLink() {
    const url = sourceLinkInput.trim();
    if (!url) {
      toast.error("Paste a video link first.");
      return;
    }
    setIsIngesting(true);
    try {
      const res = await fetch("/api/ai/video/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        // 501 = resolver not configured. Fall back to a more actionable toast
        // that nudges the user toward the upload path.
        if (res.status === 501) {
          toast.error("No video resolver configured.", {
            description:
              "Click 'or upload an MP4' below, or set VIDEO_INGEST_RESOLVER_URL on the server (cobalt instance).",
            action: {
              label: "Upload MP4",
              onClick: () => videoFileInputRef.current?.click(),
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(json.error ?? `Ingest failed (${res.status})`);
      }
      setSourceVideoUrl(json.videoUrl);
      setSourceLabel(
        `${json.source ?? "link"} · ${(json.bytes / 1_000_000).toFixed(1)} MB`
      );
      toast.success("Video imported.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      setIsIngesting(false);
    }
  }

  function startFromVideoGeneration() {
    if (!sourceVideoUrl) {
      toast.error("Import or upload a source video first.");
      return;
    }
    if (prompt.trim().length < 2 && !brandKitId) {
      toast.error("Pick a brand kit or describe the change you want.");
      return;
    }
    setStatus(null);
    setGenerationId(null);
    setVersions([]);
    setLineageId(null);
    setActiveVersionId(null);
    setProvider("runway");
    startSubmit(async () => {
      try {
        const res = await fetch("/api/ai/video", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mode: "video-to-video",
            prompt: prompt.trim() || "Match the source pacing and motion.",
            videoUrl: sourceVideoUrl,
            sourceUrl: sourceLinkInput.trim() || null,
            brandKitId: brandKitId || null,
            aspectRatio: aspect,
            durationSeconds: duration,
            provider: "runway",
            projectId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setGenerationId(json.generationId);
        setLineageId(json.lineageId ?? null);
        setStatus({ status: "queued" });
        toast.message("Re-rendering with your branding…", {
          description: "Runway is processing — typically 30s–3 minutes.",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function startInitialGeneration() {
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
    setVersions([]);
    setLineageId(null);
    setActiveVersionId(null);
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
            provider,
            projectId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setGenerationId(json.generationId);
        setLineageId(json.lineageId ?? null);
        setStatus({ status: "queued" });
        toast.message("Submitted to provider.", {
          description: "Rendering — typically 30s–3 minutes.",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function refineActiveVersion() {
    const active = versions.find((v) => v.id === activeVersionId);
    if (!active) {
      toast.error("Select a version to refine first.");
      return;
    }
    if (refinePrompt.trim().length < 2) {
      toast.error("Describe the change you want.");
      return;
    }
    if (provider !== "runway") {
      toast.error(
        "Refining an existing video requires the Runway provider. Switch above."
      );
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
            mode: "video-to-video",
            prompt: refinePrompt,
            videoUrl: active.videoUrl,
            aspectRatio: aspect,
            durationSeconds: duration,
            provider: "runway",
            projectId,
            parentAssetId: active.id,
            lineageId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setGenerationId(json.generationId);
        if (json.lineageId) setLineageId(json.lineageId);
        setStatus({ status: "queued" });
        toast.message("Refining…", {
          description: "Applying your change to the active version.",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  const activeVersion =
    versions.find((v) => v.id === activeVersionId) ??
    versions[versions.length - 1] ??
    null;
  const hasFirstVersion = versions.length > 0;
  const isWorking =
    isSubmitting ||
    status?.status === "queued" ||
    status?.status === "processing";

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      {/* LEFT: brief or refine */}
      <div className="flex flex-col gap-6">
        {!hasFirstVersion ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Brief</CardTitle>
              <CardDescription>
                Animate a product image or generate from text. After the first
                render, you&apos;ll be able to keep refining it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as Mode)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="image-to-video">
                    <ImageIcon className="size-3.5" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="text-to-video">
                    <SparklesIcon className="size-3.5" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="from-video">
                    <FilmIcon className="size-3.5" />
                    From video
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

                <TabsContent value="from-video" className="space-y-3">
                  <div className="space-y-2">
                    <Label>Reference video</Label>
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleVideoFile(f);
                      }}
                    />
                    {sourceVideoUrl ? (
                      <div className="overflow-hidden rounded-md border border-border/60 bg-black">
                        <video
                          src={sourceVideoUrl}
                          className="aspect-video w-full"
                          controls
                          muted
                          playsInline
                        />
                        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-card p-2 text-xs">
                          <span className="line-clamp-1 text-muted-foreground">
                            Imported · {sourceLabel ?? "video"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSourceVideoUrl("");
                              setSourceLabel(null);
                              setSourceLinkInput("");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Paste TikTok / Instagram / YouTube / MP4 URL"
                            value={sourceLinkInput}
                            onChange={(e) => setSourceLinkInput(e.target.value)}
                            disabled={isIngesting}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={ingestSourceLink}
                            disabled={isIngesting || !sourceLinkInput.trim()}
                          >
                            {isIngesting ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <LinkIcon className="size-4" />
                            )}
                            Import
                          </Button>
                        </div>
                        <button
                          type="button"
                          onClick={() => videoFileInputRef.current?.click()}
                          disabled={isUploadingVideo}
                          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-card text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                        >
                          {isUploadingVideo ? (
                            <Loader2Icon className="size-5 animate-spin" />
                          ) : (
                            <UploadIcon className="size-5" />
                          )}
                          {isUploadingVideo
                            ? "Uploading…"
                            : "or upload an MP4 (max 200 MB)"}
                        </button>
                        {!socialIngestEnabled && (
                          <p className="text-[11px] text-muted-foreground">
                            Direct video URLs work out of the box. To import
                            from TikTok / Instagram / YouTube, point{" "}
                            <code className="rounded bg-muted px-1">
                              VIDEO_INGEST_RESOLVER_URL
                            </code>{" "}
                            at a{" "}
                            <a
                              href="https://github.com/imputnet/cobalt"
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2"
                            >
                              cobalt
                            </a>{" "}
                            instance — or just upload the MP4 below.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Brand kit</Label>
                    <Select
                      value={brandKitId || "none"}
                      onValueChange={(v) =>
                        setBrandKitId(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No brand kit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No brand kit</SelectItem>
                        {brandKits.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                            {b.primary_color
                              ? ` · ${b.primary_color}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {brandKits.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Create one under{" "}
                        <a
                          href="/brand-kits"
                          className="underline underline-offset-2"
                        >
                          Brand kits
                        </a>{" "}
                        to inject your logo and colors.
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.07] p-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/90">
                    Heads up: only re-render videos you have rights to. The
                    output keeps the source pacing but swaps identifying
                    details for your brand — not a 1:1 copy.
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="prompt">
                  {mode === "from-video"
                    ? "Creative direction (optional)"
                    : "Motion / scene prompt"}
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === "from-video"
                      ? "Swap the product for my matcha tin. Warmer light. Add my logo as a corner bug at the end."
                      : "Slow push-in, soft light, product turns subtly toward camera."
                  }
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

              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={mode === "from-video" ? "runway" : provider}
                  onValueChange={(v) => setProvider(v as VideoProvider)}
                  disabled={mode === "from-video"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="runway">
                      Runway · gen4 / veo3 (supports refining)
                    </SelectItem>
                    <SelectItem value="fal">fal.ai · veo3 / kling</SelectItem>
                  </SelectContent>
                </Select>
                {mode === "from-video" ? (
                  <p className="text-xs text-muted-foreground">
                    Video-to-video runs on Runway gen4_aleph.
                  </p>
                ) : provider === "fal" ? (
                  <p className="text-xs text-muted-foreground">
                    Refining requires Runway. Switch after the first render to
                    keep iterating.
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={
                  mode === "from-video"
                    ? startFromVideoGeneration
                    : startInitialGeneration
                }
                disabled={isWorking}
                variant="ink"
                size="lg"
                className="w-full"
              >
                {isWorking ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {mode === "from-video" ? "Re-rendering…" : "Generating…"}
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    {mode === "from-video"
                      ? "Re-render with my brand"
                      : "Generate video"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Wand2Icon className="size-4 text-primary" />
                Refine active version
              </CardTitle>
              <CardDescription>
                Apply a new prompt on top of v{(versions.findIndex(
                  (v) => v.id === activeVersionId
                ) ?? 0) + 1}. Each refine becomes a new version you can revisit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refine-prompt">What should change?</Label>
                <Textarea
                  id="refine-prompt"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Make the lighting warmer, slow the camera, swap the background to a marble countertop."
                  rows={4}
                />
              </div>
              {provider !== "runway" && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">
                  Switching to Runway is required for refinement. Click below
                  to apply.
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ink"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    if (provider !== "runway") setProvider("runway");
                    refineActiveVersion();
                  }}
                  disabled={isWorking || !activeVersion}
                >
                  {isWorking ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      Refining…
                    </>
                  ) : (
                    <>
                      <Wand2Icon />
                      Refine
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setVersions([]);
                    setActiveVersionId(null);
                    setLineageId(null);
                    setStatus(null);
                    setGenerationId(null);
                    setPrompt("");
                    setRefinePrompt("");
                    setImageUrl("");
                  }}
                >
                  New
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: refer to the active version (e.g. &quot;keep the same
                product and angle, but…&quot;) for tighter edits.
              </p>
            </CardContent>
          </Card>
        )}

        {versions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Versions</CardTitle>
              <CardDescription>
                Click any version to make it active. Refines branch off the
                active version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVersionId(v.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-2 text-left transition",
                    v.id === (activeVersionId ?? versions[versions.length - 1]?.id)
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-secondary">
                    <video
                      src={v.videoUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">v{i + 1}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {v.mode === "video-to-video"
                          ? "refine"
                          : v.mode === "image-to-video"
                          ? "i2v"
                          : "t2v"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatRelative(v.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {v.prompt || "—"}
                    </p>
                  </div>
                  {v.id ===
                    (activeVersionId ?? versions[versions.length - 1]?.id) && (
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT: output */}
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

        {isWorking ? (
          <Card className="flex aspect-video items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <span>
                {versions.length === 0
                  ? "Provider is rendering. This typically takes 30s–3 minutes."
                  : "Refining your video — typically 30s–3 minutes."}
              </span>
            </div>
          </Card>
        ) : status?.status === "failed" ? (
          <Card className="p-8 text-center text-sm text-destructive">
            {status.error ?? "Generation failed"}
          </Card>
        ) : activeVersion ? (
          <Card className="overflow-hidden p-0">
            <video
              key={activeVersion.id}
              className="aspect-video w-full bg-black"
              src={activeVersion.videoUrl}
              controls
              autoPlay
              loop
              playsInline
            />
            <div className="flex items-center justify-between gap-3 border-t border-border/60 p-3 text-xs text-muted-foreground">
              <span className="line-clamp-1">
                Active prompt: {activeVersion.prompt || "—"}
              </span>
              <a
                href={activeVersion.videoUrl}
                target="_blank"
                rel="noreferrer"
                download
              >
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </a>
            </div>
          </Card>
        ) : (
          <Card className="flex aspect-video items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <PlayIcon className="size-6" />
              <span>Generated video will appear here.</span>
            </div>
          </Card>
        )}

        {!status && versions.length === 0 && (
          <Skeleton className="hidden h-1 w-full" />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { DownloadIcon, Loader2Icon, SparklesIcon } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatioPicker } from "@/components/app/aspect-ratio-picker";
import { type AspectRatio } from "@/lib/platform-presets";
import type { Asset } from "@/types/database";

const AUTO_SCENE = "__auto__";

const SCENES = [
  { value: AUTO_SCENE, label: "Auto" },
  { value: "luxury studio still life", label: "Luxury still life" },
  { value: "outdoor lifestyle ad", label: "Outdoor lifestyle" },
  { value: "minimal product packshot", label: "Packshot" },
  { value: "dramatic ad with rim lighting", label: "Dramatic ad" },
  { value: "thumbnail / banner composition", label: "Thumbnail / banner" },
];

export function ImageForm({ projectId }: { projectId: string | null }) {
  const [prompt, setPrompt] = useState("");
  const [scene, setScene] = useState<string>(AUTO_SCENE);
  const [product, setProduct] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [aspect, setAspect] = useState<AspectRatio>("1:1");
  const [quality, setQuality] = useState<"low" | "medium" | "high">("high");
  const [n, setN] = useState(1);
  const [isPending, start] = useTransition();
  const [assets, setAssets] = useState<Asset[] | null>(null);

  function submit() {
    if (prompt.trim().length < 2) {
      toast.error("Describe what you want to generate.");
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prompt,
            scene: scene && scene !== AUTO_SCENE ? scene : undefined,
            product: product || undefined,
            primaryColor: primaryColor || undefined,
            accentColor: accentColor || undefined,
            aspect,
            quality,
            n,
            projectId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setAssets(json.assets ?? []);
        toast.success("Image generated.", {
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
          <CardTitle className="font-display">Brief</CardTitle>
          <CardDescription>
            Pick a scene, an aspect ratio, and describe the shot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <AspectRatioPicker value={aspect} onChange={setAspect} />
          </div>

          <div className="space-y-2">
            <Label>Scene</Label>
            <Select value={scene} onValueChange={setScene}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Auto" />
              </SelectTrigger>
              <SelectContent>
                {SCENES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Subject (optional)</Label>
            <Input
              id="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Black leather backpack"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Editorial product shot on travertine, soft daylight from the left, gold accents."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="primary">Primary color</Label>
              <Input
                id="primary"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#0F172A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent">Accent color</Label>
              <Input
                id="accent"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#D4AF37"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select
                value={quality}
                onValueChange={(v) =>
                  setQuality(v as "low" | "medium" | "high")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (fast)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Variations</Label>
              <Select
                value={String(n)}
                onValueChange={(v) => setN(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2].map((x) => (
                    <SelectItem key={x} value={String(x)}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                <SparklesIcon />
                Generate image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="font-display text-lg">Output</h2>
        {isPending && !assets ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="aspect-square" />
            {n > 1 && <Skeleton className="aspect-square" />}
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {assets.map((a) => (
              <ImageResult key={a.id} asset={a} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Generated images will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ImageResult({ asset }: { asset: Asset }) {
  if (!asset.file_url) return null;
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-square w-full bg-secondary">
        <Image
          src={asset.file_url}
          alt={asset.title ?? "Generated image"}
          fill
          unoptimized={asset.file_url.startsWith("data:")}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-center justify-between p-3">
        <span className="truncate text-xs text-muted-foreground">
          {asset.title ?? "Untitled"}
        </span>
        <a href={asset.file_url} download target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">
            <DownloadIcon className="size-3.5" />
            Download
          </Button>
        </a>
      </div>
    </Card>
  );
}

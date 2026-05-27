"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  DownloadIcon,
  Loader2Icon,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Asset } from "@/types/database";
import { type AspectRatio } from "@/lib/platform-presets";

export function FlyerForm({ projectId }: { projectId: string | null }) {
  const [type, setType] = useState<"flyer" | "business_card">("flyer");
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [aspect, setAspect] = useState<AspectRatio>("4:5");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, start] = useTransition();
  const [asset, setAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleLogo(file: File) {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      setLogoUrl(json.url);
      toast.success("Logo uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function submit() {
    if (prompt.trim().length < 2) {
      toast.error("Describe what you want.");
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/ai/flyer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type,
            prompt,
            brandName: brandName || undefined,
            tagline: tagline || undefined,
            primaryColor: primaryColor || undefined,
            accentColor: accentColor || undefined,
            fontFamily: fontFamily || undefined,
            logoUrl: logoUrl || undefined,
            aspect,
            projectId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setAsset(json.asset);
        toast.success("Design ready.");
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
            Describe what you want. Add brand colors and a logo for on-brand output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs
            value={type}
            onValueChange={(v) =>
              setType(v as "flyer" | "business_card")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flyer">Flyer</TabsTrigger>
              <TabsTrigger value="business_card">Business card</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Spring sale, 30% off womenswear, photo-led layout, gold serif headline."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Aurum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Quiet luxury, loud results."
              />
            </div>
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
              <Label htmlFor="accent">Accent</Label>
              <Input
                id="accent"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#D4AF37"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font">Font family</Label>
            <Input
              id="font"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              placeholder="Playfair Display + Inter"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogo(f);
              }}
            />
            {logoUrl ? (
              <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card p-2">
                <div className="relative size-12 overflow-hidden rounded bg-secondary">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoUrl("")}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-card px-3 py-3 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                {isUploading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <UploadIcon className="size-4" />
                )}
                {isUploading ? "Uploading…" : "Upload logo"}
              </button>
            )}
          </div>

          {type === "flyer" && (
            <div className="space-y-2">
              <Label>Aspect</Label>
              <Select
                value={aspect}
                onValueChange={(v) => setAspect(v as AspectRatio)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4:5">Portrait · 4:5</SelectItem>
                  <SelectItem value="1:1">Square · 1:1</SelectItem>
                  <SelectItem value="9:16">Vertical · 9:16</SelectItem>
                  <SelectItem value="3:4">Portrait · 3:4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            variant="gold"
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Designing…
              </>
            ) : (
              <>
                <SparklesIcon />
                Generate
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="font-display text-lg">Output</h2>
        {asset?.file_url ? (
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-square w-full bg-secondary">
              <Image
                src={asset.file_url}
                alt={asset.title ?? "Design"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="truncate text-xs text-muted-foreground">
                {asset.title}
              </span>
              <a
                href={asset.file_url}
                download
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="ghost" size="sm">
                  <DownloadIcon className="size-3.5" />
                  Download PNG
                </Button>
              </a>
            </div>
          </Card>
        ) : isPending ? (
          <Card className="flex aspect-square items-center justify-center p-12">
            <Loader2Icon className="size-6 animate-spin text-primary" />
          </Card>
        ) : (
          <Card className="flex aspect-square items-center justify-center p-12 text-sm text-muted-foreground">
            Generated design will appear here.
          </Card>
        )}
      </div>
    </div>
  );
}

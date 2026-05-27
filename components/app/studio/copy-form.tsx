"use client";

import { useState, useTransition } from "react";
import { CopyIcon, Loader2Icon, SparklesIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { PlatformSelector } from "@/components/app/platform-selector";
import { COPY_KIND_LABELS, type CopyKind } from "@/lib/ai/prompts";
import { type Platform } from "@/lib/platform-presets";

type CopyResponse = {
  ok?: boolean;
  items?: string[];
  remaining?: number;
  error?: string;
};

export function CopyForm({ projectId }: { projectId: string | null }) {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [kind, setKind] = useState<CopyKind>("hook");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [extras, setExtras] = useState("");
  const [count, setCount] = useState(5);
  const [isPending, start] = useTransition();
  const [result, setResult] = useState<string[] | null>(null);

  function submit() {
    if (product.trim().length < 2) {
      toast.error("Tell me about your product first.");
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/ai/copy", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            platform,
            kind,
            product,
            audience,
            brandVoice,
            extras,
            count,
            projectId,
          }),
        });
        const json: CopyResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
        setResult(json.items ?? []);
        toast.success("Generated.", {
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
            Pick a platform and tell us about the offer. We do the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Platform</Label>
            <PlatformSelector value={platform} onChange={setPlatform} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as CopyKind)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COPY_KIND_LABELS) as CopyKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {COPY_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Variations</Label>
              <Select
                value={String(count)}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product / offer</Label>
            <Textarea
              id="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="A waterproof leather backpack for designers, $189."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audience (optional)</Label>
            <Input
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Creative founders, 25–45"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandVoice">Brand voice (optional)</Label>
            <Input
              id="brandVoice"
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="Confident, minimal, dry humor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extras">Notes (optional)</Label>
            <Textarea
              id="extras"
              value={extras}
              onChange={(e) => setExtras(e.target.value)}
              placeholder="Mention free shipping, avoid superlatives."
              rows={2}
            />
          </div>

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
                Generating…
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Output</h2>
          {result && <Badge variant="secondary">{result.length} items</Badge>}
        </div>

        {isPending && !result ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : result && result.length > 0 ? (
          <div className="flex flex-col gap-3">
            {result.map((item, i) => (
              <CopyItem key={i} text={item} />
            ))}
          </div>
        ) : (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Generated copy will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function CopyItem({ text }: { text: string }) {
  return (
    <Card className="group">
      <CardContent className="flex items-start justify-between gap-4">
        <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
          }}
        >
          <CopyIcon className="size-3.5" />
          Copy
        </Button>
      </CardContent>
    </Card>
  );
}

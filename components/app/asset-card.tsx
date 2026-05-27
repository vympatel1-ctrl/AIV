import Image from "next/image";
import Link from "next/link";
import {
  FileTextIcon,
  ImageIcon,
  Music2Icon,
  PlayIcon,
  PrinterIcon,
} from "lucide-react";

import type { Asset } from "@/types/database";
import { formatRelative } from "@/lib/utils";

const ICONS: Record<Asset["type"], React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: PlayIcon,
  copy: FileTextIcon,
  flyer: PrinterIcon,
  audio: Music2Icon,
};

const LABELS: Record<Asset["type"], string> = {
  image: "Image",
  video: "Video",
  copy: "Copy",
  flyer: "Flyer",
  audio: "Audio",
};

export function AssetCard({ asset }: { asset: Asset }) {
  const Icon = ICONS[asset.type] ?? FileTextIcon;
  const preview =
    asset.thumbnail_url ??
    (asset.type === "image" || asset.type === "flyer"
      ? asset.file_url
      : null);

  return (
    <Link
      href={`/library/${asset.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
        {preview ? (
          <Image
            src={preview}
            alt={asset.title ?? "Asset"}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : asset.type === "copy" && asset.content ? (
          <CopyPreview content={asset.content} />
        ) : asset.type === "video" && asset.file_url ? (
          <video
            className="h-full w-full object-cover"
            src={asset.file_url}
            muted
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Icon className="size-8" />
          </div>
        )}
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-md">
          <Icon className="size-3" />
          {LABELS[asset.type]}
        </div>
        {asset.type === "video" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-black/50 backdrop-blur">
              <PlayIcon className="size-5 fill-white text-white" />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <h3 className="truncate text-sm font-medium">
          {asset.title ?? "Untitled"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatRelative(asset.created_at)}
        </p>
      </div>
    </Link>
  );
}

function CopyPreview({ content }: { content: unknown }) {
  let text = "";
  try {
    if (typeof content === "string") {
      text = content;
    } else if (content && typeof content === "object") {
      const c = content as Record<string, unknown>;
      if (typeof c.body === "string") text = c.body;
      else if (Array.isArray(c.items)) {
        text = c.items
          .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
          .slice(0, 3)
          .join(" · ");
      } else {
        text = JSON.stringify(content).slice(0, 200);
      }
    }
  } catch {
    text = "";
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
      <p className="line-clamp-4 font-display text-sm text-muted-foreground">
        {text || "Generated copy"}
      </p>
    </div>
  );
}

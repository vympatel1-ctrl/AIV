import Link from "next/link";
import {
  FileTextIcon,
  ImageIcon,
  LibraryIcon,
  Music2Icon,
  PlayIcon,
  PrinterIcon,
  SparklesIcon,
} from "lucide-react";

import { AssetCard } from "@/components/app/asset-card";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listAssetsByType } from "@/lib/db/assets";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/types/database";

type Filter = AssetType | "all";

const FILTERS: { id: Filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: LibraryIcon },
  { id: "video", label: "Videos", icon: PlayIcon },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "copy", label: "Copy", icon: FileTextIcon },
  { id: "flyer", label: "Flyers", icon: PrinterIcon },
  { id: "audio", label: "Voiceovers", icon: Music2Icon },
];

const SUMMARIES: Record<Filter, string> = {
  all: "Every video, image, copy variant, flyer, and voiceover you've generated.",
  video: "All videos and refinement versions you've made.",
  image: "Generated product, lifestyle, and editorial images.",
  copy: "Hooks, captions, scripts, and CTAs.",
  flyer: "Business cards and flyer designs.",
  audio: "Voiceovers and audio renders.",
};

function isFilter(v: string | undefined): v is Filter {
  return v === "all" || ["video", "image", "copy", "flyer", "audio"].includes(v ?? "");
}

export default async function LibraryPage(props: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await props.searchParams;
  const filter: Filter = isFilter(sp.type) ? sp.type : "all";
  const user = await getCurrentUser();
  const assets = await listAssetsByType(
    user.userId,
    filter === "all" ? null : (filter as AssetType),
    { limit: 120 }
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Workspace</p>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SUMMARIES[filter]}
          </p>
        </div>
        <Link href="/studio/video">
          <Button variant="ink">
            <SparklesIcon />
            New generation
          </Button>
        </Link>
      </header>

      <nav className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const href = f.id === "all" ? "/library" : `/library?type=${f.id}`;
          const Icon = f.icon;
          return (
            <Link
              key={f.id}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {f.label}
            </Link>
          );
        })}
      </nav>

      {assets.length === 0 ? (
        <EmptyState
          icon={LibraryIcon}
          title="Nothing here yet"
          description="Generate something in the studio and it will appear here automatically."
          action={
            <Link href="/studio/video">
              <Button variant="ink">
                <SparklesIcon />
                Open studio
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      )}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileTextIcon,
  Music2Icon,
  PrinterIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAsset, listAssetLineage } from "@/lib/db/assets";
import { listProjects } from "@/lib/db/projects";
import { formatRelative } from "@/lib/utils";
import {
  deleteAssetAction,
  moveAssetAction,
  renameAssetAction,
} from "../actions";

const TYPE_LABELS: Record<string, string> = {
  video: "Video",
  image: "Image",
  copy: "Copy",
  flyer: "Flyer",
  audio: "Audio",
};

export default async function AssetDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  const asset = await getAsset(user.userId, id);
  if (!asset) notFound();

  const projects = await listProjects(user.userId, { limit: 200 });
  const meta = (asset.metadata ?? {}) as {
    aspect?: string;
    mode?: string;
    prompt?: string;
    lineage_id?: string | null;
    parent_asset_id?: string | null;
    provider_url?: string | null;
    storage_path?: string | null;
    bytes?: number | null;
    persisted?: boolean;
  };

  const lineage = meta.lineage_id
    ? await listAssetLineage(user.userId, meta.lineage_id)
    : [];
  const versionIndex = lineage.findIndex((a) => a.id === asset.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link
        href="/library"
        className="inline-flex w-fit items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to library
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {TYPE_LABELS[asset.type] ?? asset.type} ·{" "}
            {formatRelative(asset.created_at)}
          </p>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
            {asset.title ?? "Untitled"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {meta.aspect && (
              <Badge variant="secondary" className="text-[10px]">
                {meta.aspect}
              </Badge>
            )}
            {meta.mode && (
              <Badge variant="secondary" className="text-[10px]">
                {meta.mode}
              </Badge>
            )}
            {versionIndex >= 0 && lineage.length > 1 && (
              <Badge variant="secondary" className="text-[10px]">
                v{versionIndex + 1} of {lineage.length}
              </Badge>
            )}
            {meta.persisted === false && (
              <Badge variant="destructive" className="text-[10px]">
                Provider URL — may expire
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {asset.file_url && (
            <a
              href={asset.file_url}
              target="_blank"
              rel="noreferrer"
              download={`${asset.title ?? "asset"}.${
                asset.type === "video"
                  ? "mp4"
                  : asset.type === "image"
                  ? "png"
                  : asset.type === "audio"
                  ? "mp3"
                  : "bin"
              }`}
            >
              <Button variant="outline" size="sm">
                <DownloadIcon />
                Download
              </Button>
            </a>
          )}
          <form action={deleteAssetAction}>
            <input type="hidden" name="id" value={asset.id} />
            <Button type="submit" variant="ghost" size="sm">
              <Trash2Icon />
              Delete
            </Button>
          </form>
        </div>
      </header>

      <Card className="overflow-hidden p-0">
        <AssetPreview asset={asset} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Rename</CardTitle>
            <CardDescription>
              Change the title shown in the library and on cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={renameAssetAction} className="flex gap-2">
              <input type="hidden" name="id" value={asset.id} />
              <Input
                name="title"
                defaultValue={asset.title ?? ""}
                placeholder="My branded reel"
                maxLength={200}
              />
              <Button type="submit" variant="ink">
                Save
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Project</CardTitle>
            <CardDescription>
              Group this asset with related work in a project folder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={moveAssetAction} className="flex gap-2">
              <input type="hidden" name="id" value={asset.id} />
              <Select
                name="project_id"
                defaultValue={asset.project_id ?? "none"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" variant="ink">
                Move
              </Button>
            </form>
            {projects.length === 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Create a project under{" "}
                <Link href="/projects" className="underline underline-offset-2">
                  Projects
                </Link>{" "}
                first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {meta.prompt && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Prompt</CardTitle>
            <CardDescription>
              The brief used when this was generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {meta.prompt}
            </p>
          </CardContent>
        </Card>
      )}

      {lineage.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Versions</CardTitle>
            <CardDescription>
              Other variants in this edit chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {lineage.map((v, i) => (
              <Link
                key={v.id}
                href={`/library/${v.id}`}
                className={`flex items-center gap-3 rounded-md border p-2 text-left transition ${
                  v.id === asset.id
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-secondary">
                  {v.type === "video" && v.file_url ? (
                    <video
                      src={v.file_url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : v.thumbnail_url ? (
                    <Image
                      src={v.thumbnail_url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">v{i + 1}</p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                    {v.title ?? "Untitled"}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AssetPreview({ asset }: { asset: Awaited<ReturnType<typeof getAsset>> }) {
  if (!asset || !asset.file_url) {
    return (
      <div className="flex aspect-video items-center justify-center bg-secondary text-muted-foreground">
        <FileTextIcon className="size-10" />
      </div>
    );
  }

  if (asset.type === "video") {
    return (
      <video
        className="aspect-video w-full bg-black"
        src={asset.file_url}
        poster={asset.thumbnail_url ?? undefined}
        controls
        autoPlay
        loop
        playsInline
      />
    );
  }

  if (asset.type === "image" || asset.type === "flyer") {
    return (
      <div className="relative aspect-video w-full bg-secondary">
        <Image
          src={asset.file_url}
          alt={asset.title ?? "Asset"}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain"
        />
      </div>
    );
  }

  if (asset.type === "audio") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-10">
        <Music2Icon className="size-10 text-muted-foreground" />
        <audio controls src={asset.file_url} className="w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-secondary text-muted-foreground">
      {asset.type === "copy" ? (
        <FileTextIcon className="size-10" />
      ) : (
        <PrinterIcon className="size-10" />
      )}
    </div>
  );
}

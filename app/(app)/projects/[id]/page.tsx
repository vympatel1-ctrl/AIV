import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ImageIcon,
  PenLineIcon,
  PlayIcon,
  PrinterIcon,
} from "lucide-react";

import { AssetCard } from "@/components/app/asset-card";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listProjectAssets } from "@/lib/db/assets";
import { getProject } from "@/lib/db/projects";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteProjectAction } from "../actions";

const studioLinks = [
  { href: "/studio/copy", label: "Copy", icon: PenLineIcon },
  { href: "/studio/image", label: "Image", icon: ImageIcon },
  { href: "/studio/video", label: "Video", icon: PlayIcon },
  { href: "/studio/flyer", label: "Flyer", icon: PrinterIcon },
];

export default async function ProjectDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  const project = await getProject(user.userId, id);
  if (!project) notFound();

  const assets = await listProjectAssets(user.userId, project.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          All projects
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                {project.name}
              </h1>
              {project.category && (
                <Badge variant="outline">{project.category}</Badge>
              )}
            </div>
            {project.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project.id} />
            <Button type="submit" variant="outline" size="sm">
              Delete project
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {studioLinks.map((s) => (
          <Link
            key={s.href}
            href={`${s.href}?projectId=${project.id}`}
            className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <s.icon className="size-3.5" />
            Generate {s.label.toLowerCase()}
          </Link>
        ))}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Nothing here yet"
          description="Generate assets from any studio and save them to this project."
          action={
            <Link href={`/studio/copy?projectId=${project.id}`}>
              <Button variant="ink">Open Copy studio</Button>
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

import Link from "next/link";
import Image from "next/image";
import { FolderIcon } from "lucide-react";

import type { Project } from "@/types/database";
import { formatRelative } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        {project.cover_url ? (
          <Image
            src={project.cover_url}
            alt={project.name}
            fill
            sizes="(max-width: 640px) 100vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card to-secondary text-muted-foreground">
            <FolderIcon className="size-8" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-medium">{project.name}</h3>
          {project.category && (
            <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {project.category}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {formatRelative(project.updated_at)}
        </p>
      </div>
    </Link>
  );
}

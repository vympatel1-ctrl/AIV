import Link from "next/link";
import { FolderIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/app/project-card";
import { EmptyState } from "@/components/app/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listProjectCategories, listProjects } from "@/lib/db/projects";

export default async function ProjectsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await props.searchParams;
  const category = sp.category ?? null;
  const user = await getCurrentUser();
  const [projects, categories] = await Promise.all([
    listProjects(user.userId, { category: category ?? undefined }),
    listProjectCategories(user.userId),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Workspace</p>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group your generated assets into folders.
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="ink">
            <PlusIcon />
            New project
          </Button>
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/projects"
            className={`rounded-full border px-3 py-1 text-xs transition ${
              !category
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:bg-card"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/projects?category=${encodeURIComponent(c)}`}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                category === c
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-card"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No projects yet"
          description="Create a project to start saving generated assets and organize them into folders."
          action={
            <Link href="/projects/new">
              <Button variant="ink">
                <PlusIcon />
                Create project
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

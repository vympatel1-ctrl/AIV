import Link from "next/link";
import {
  ArrowRightIcon,
  ImageIcon,
  LibraryIcon,
  PenLineIcon,
  PlayIcon,
  PrinterIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listProjects } from "@/lib/db/projects";
import { listAssetsByType, listRecentAssets } from "@/lib/db/assets";
import { ProjectCard } from "@/components/app/project-card";
import { AssetCard } from "@/components/app/asset-card";
import { EmptyState } from "@/components/app/empty-state";

const quickActions = [
  {
    href: "/studio/copy",
    label: "Generate copy",
    description: "Hooks, captions, scripts.",
    icon: PenLineIcon,
  },
  {
    href: "/studio/image",
    label: "Generate image",
    description: "Product scenes, ads.",
    icon: ImageIcon,
  },
  {
    href: "/studio/video",
    label: "Generate video",
    description: "Vertical short-form.",
    icon: PlayIcon,
  },
  {
    href: "/studio/flyer",
    label: "Design flyer",
    description: "Cards & flyers.",
    icon: PrinterIcon,
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [projects, assets, recentVideos] = await Promise.all([
    listProjects(user.userId, { limit: 4 }),
    listRecentAssets(user.userId, 6),
    listAssetsByType(user.userId, "video", { limit: 4 }),
  ]);

  const firstName = (user.profile.full_name ?? user.name).split(" ")[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12">
      {/* ====================================================
       *  HERO
       * ==================================================== */}
      <section>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Good to see you, <span className="italic ink-text">{firstName}</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Pick up where you left off, or start something new from a studio.
        </p>
      </section>

      {/* ====================================================
       *  QUICK ACTIONS — editorial card row
       * ==================================================== */}
      <section>
        <SectionHeading eyebrow="Start" title="Studios" />
        <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-foreground/10 bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex h-full flex-col justify-between gap-8 bg-card p-6 transition-colors hover:bg-card/70"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <a.icon className="size-4" />
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl tracking-tight">
                  {a.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ====================================================
       *  RECENT PROJECTS
       * ==================================================== */}
      <section>
        <SectionHeading
          eyebrow="Recent"
          title="Projects"
          action={
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRightIcon />
              </Button>
            </Link>
          }
        />
        {projects.length === 0 ? (
          <EmptyState
            icon={SparklesIcon}
            title="No projects yet"
            description="Spin one up to start saving generated assets."
            action={
              <Link href="/projects/new">
                <Button variant="ink">Create your first project</Button>
              </Link>
            }
          />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* ====================================================
       *  RECENT VIDEOS
       * ==================================================== */}
      {recentVideos.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="Latest"
            title="Videos"
            action={
              <Link href="/library?type=video">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRightIcon />
                </Button>
              </Link>
            }
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentVideos.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        </section>
      )}

      {/* ====================================================
       *  RECENT GENERATIONS
       * ==================================================== */}
      <section>
        <SectionHeading
          eyebrow="From the library"
          title="Recent generations"
          action={
            <Link href="/library">
              <Button variant="ghost" size="sm">
                <LibraryIcon />
                Open library
              </Button>
            </Link>
          }
        />
        {assets.length === 0 ? (
          <EmptyState
            icon={SparklesIcon}
            title="Nothing generated yet"
            description="Your latest copy, images, videos, voiceovers, and flyers will appear here automatically."
            action={
              <Link href="/studio/video">
                <Button variant="ink">Open studio</Button>
              </Link>
            }
          />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        )}
      </section>

      {/* ====================================================
       *  BRAND KIT CTA
       * ==================================================== */}
      <Card className="overflow-hidden border-foreground/10 bg-card editorial-shadow">
        <CardContent className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Brand kits
            </p>
            <CardTitle className="mt-2 font-display text-2xl tracking-tight">
              Set the brand once.{" "}
              <span className="italic ink-text">Reuse everywhere.</span>
            </CardTitle>
            <CardDescription className="mt-2">
              Save logos, colors, and fonts so every generation feels like
              the same product.
            </CardDescription>
          </div>
          <Link href="/brand-kits" className="shrink-0">
            <Button variant="ink" size="lg">
              Open brand kits
              <ArrowRightIcon />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-foreground/10 pb-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

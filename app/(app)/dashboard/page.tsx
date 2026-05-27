import Link from "next/link";
import {
  ArrowRightIcon,
  ImageIcon,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listProjects } from "@/lib/db/projects";
import { listRecentAssets } from "@/lib/db/assets";
import { ProjectCard } from "@/components/app/project-card";
import { AssetCard } from "@/components/app/asset-card";
import { EmptyState } from "@/components/app/empty-state";

const quickActions = [
  {
    href: "/studio/copy",
    label: "Generate copy",
    description: "Hooks, captions, scripts",
    icon: PenLineIcon,
  },
  {
    href: "/studio/image",
    label: "Generate image",
    description: "Product scenes, ads",
    icon: ImageIcon,
  },
  {
    href: "/studio/video",
    label: "Generate video",
    description: "Vertical short-form",
    icon: PlayIcon,
  },
  {
    href: "/studio/flyer",
    label: "Design flyer",
    description: "Cards & flyers",
    icon: PrinterIcon,
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [projects, assets] = await Promise.all([
    listProjects(user.userId, { limit: 4 }),
    listRecentAssets(user.userId, 6),
  ]);

  const firstName = (user.profile.full_name ?? user.name).split(" ")[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <section>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Good to see you, {firstName}.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick up where you left off, or start something new from the studio.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="group h-full transition-all hover:border-primary/40 hover:bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <a.icon className="size-5" />
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <CardTitle className="mt-4 font-display text-lg">
                  {a.label}
                </CardTitle>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Recent projects</h2>
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRightIcon />
            </Button>
          </Link>
        </div>
        {projects.length === 0 ? (
          <EmptyState
            icon={SparklesIcon}
            title="No projects yet"
            description="Spin one up to start saving generated assets."
            action={
              <Link href="/projects/new">
                <Button variant="gold">Create your first project</Button>
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
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Recent generations</h2>
        </div>
        {assets.length === 0 ? (
          <EmptyState
            title="Nothing generated yet"
            description="Your latest copy, images, and videos will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        )}
      </section>

      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">
              Build a brand kit once, reuse everywhere.
            </CardTitle>
            <CardDescription className="mt-1">
              Save logos, colors, and fonts so every generation matches your
              brand.
            </CardDescription>
          </div>
          <Link href="/brand-kits">
            <Button variant="gold">
              Open Brand Kits
              <ArrowRightIcon />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

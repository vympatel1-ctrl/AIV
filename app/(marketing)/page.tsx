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
import { Badge } from "@/components/ui/badge";
import { signInMock } from "@/app/auth-actions";

const features = [
  {
    icon: PenLineIcon,
    name: "Copy Studio",
    description:
      "Hooks, captions, headlines, CTAs, and full scripts tuned for TikTok, Instagram, Facebook, and YouTube.",
  },
  {
    icon: ImageIcon,
    name: "Image Studio",
    description:
      "Luxury product scenes, ads, thumbnails, and banners across every platform aspect ratio.",
  },
  {
    icon: PlayIcon,
    name: "Video Studio",
    description:
      "Image-to-video and short-form vertical videos via a swappable provider layer (fal.ai, Runway, Veo, Kling).",
  },
  {
    icon: PrinterIcon,
    name: "Brand Studio",
    description:
      "Business cards and flyers from a prompt, with logo upload and brand colors/fonts baked in.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative">
      <BackgroundGlow />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-lg tracking-wide">Aurum</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="hover:text-foreground transition">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground transition">
            Pricing
          </a>
          <Link href="/billing" className="hover:text-foreground transition">
            Plans
          </Link>
        </nav>
        <form action={signInMock}>
          <Button type="submit" variant="gold" size="sm">
            Sign in
            <ArrowRightIcon />
          </Button>
        </form>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-28 sm:pt-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge variant="outline" className="mb-6 border-primary/40">
            <SparklesIcon className="size-3.5" />
            <span className="text-xs tracking-wide text-muted-foreground">
              AI Business Content · Built for founders
            </span>
          </Badge>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            The luxury studio for{" "}
            <span className="gold-text">AI business content.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Generate ad copy, product imagery, short-form video, and flyers
            from one quiet, dark interface. Save everything to projects.
            Launch on every platform.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <form action={signInMock}>
              <Button type="submit" size="xl" variant="gold">
                Enter the studio
                <ArrowRightIcon />
              </Button>
            </form>
            <Link href="#features">
              <Button size="xl" variant="outline">
                See what&apos;s inside
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-6 text-center text-sm text-muted-foreground sm:grid-cols-6">
          {[
            "TikTok",
            "Instagram",
            "Facebook",
            "YouTube",
            "Reels",
            "Shorts",
          ].map((p) => (
            <div
              key={p}
              className="font-display tracking-wider opacity-70 hover:opacity-100 transition"
            >
              {p}
            </div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-28"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.name}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/40 hover:bg-card/80"
            >
              <div className="mb-5 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display text-lg">{f.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="pricing"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-32"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Simple, fair pricing.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pay for credits, not seats. Cancel anytime.
          </p>
          <div className="mt-8">
            <Link href="/billing">
              <Button size="lg" variant="outline">
                View plans
                <ArrowRightIcon />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo small />
            <span>© {new Date().getFullYear()} Aurum Studio</span>
          </div>
          <div className="flex gap-4">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Logo({ small }: { small?: boolean }) {
  const size = small ? "size-5" : "size-6";
  return (
    <div
      className={`relative ${size} rounded-md gold-gradient luxury-glow`}
      aria-hidden
    />
  );
}

function BackgroundGlow() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(from var(--primary) l c h / 0.16) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-40 -z-10 h-[40vh]"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 100%, oklch(from var(--primary) l c h / 0.08) 0%, transparent 70%)",
        }}
      />
    </>
  );
}

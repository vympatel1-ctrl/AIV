import Link from "next/link";
import {
  ArrowRightIcon,
  ImageIcon,
  LinkIcon,
  PenLineIcon,
  PlayIcon,
  PrinterIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";
import { Marquee } from "@/components/app/marquee";

const platforms = [
  "TikTok",
  "Instagram",
  "Reels",
  "YouTube",
  "Shorts",
  "Facebook",
  "LinkedIn",
  "X",
  "Pinterest",
];

const ways = [
  {
    eyebrow: "01",
    icon: PenLineIcon,
    title: "From a brief",
    body: "Type a paragraph. Pick a platform. Get a structured short with copy, scenes, and pacing — built around your brand kit.",
  },
  {
    eyebrow: "02",
    icon: ImageIcon,
    title: "From an image",
    body: "Drop a product shot or hero still. AIV animates it into a clean, ad-ready short with the right aspect for every channel.",
  },
  {
    eyebrow: "03",
    icon: LinkIcon,
    title: "From a reference link",
    body: "Paste an Instagram, TikTok, or YouTube URL. AIV studies the structure and re-renders it in your voice and visuals.",
  },
];

const studios = [
  {
    icon: PenLineIcon,
    name: "Copy",
    blurb:
      "Hooks, captions, and scripts shaped for each platform — not a one-size-fits-all blob.",
  },
  {
    icon: ImageIcon,
    name: "Image",
    blurb:
      "Editorial product scenes, ads, thumbnails. Rendered in your palette, sized for every surface.",
  },
  {
    icon: PlayIcon,
    name: "Video",
    blurb:
      "Image-to-video, text-to-video, and reference-to-video. One studio, swappable model layer.",
  },
  {
    icon: PrinterIcon,
    name: "Print",
    blurb:
      "Cards, flyers, and one-pagers from a prompt. Logo, type, and color baked in.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative">
      {/* Subtle grid backdrop, masked at the bottom */}
      <div className="grain pointer-events-none absolute inset-x-0 top-0 h-[78vh] -z-10">
        <div className="grid-bg h-full w-full" />
      </div>

      {/* ============================================================
       * HEADER
       * ============================================================ */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo href="/" size="md" />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a
            href="#ways"
            className="transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#studios"
            className="transition-colors hover:text-foreground"
          >
            Studios
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="ink" size="sm">
              Get started
              <ArrowRightIcon />
            </Button>
          </Link>
        </div>
      </header>

      {/* ============================================================
       * HERO
       * ============================================================ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-24 sm:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span
            className="animate-rise mb-7 inline-flex items-center gap-2 rounded-full border border-foreground/12 bg-card px-3 py-1 text-xs tracking-wide text-muted-foreground"
            style={{ animationDelay: "0ms" }}
          >
            <span className="relative inline-flex">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="absolute inset-0 size-1.5 animate-pulse-soft rounded-full bg-primary/60" />
            </span>
            <span>AI video for founders · v1</span>
          </span>

          <h1 className="font-display text-[2.75rem] leading-[1.04] tracking-tight sm:text-7xl">
            <span
              className="animate-rise inline-block"
              style={{ animationDelay: "60ms" }}
            >
              The studio for{" "}
            </span>
            <span
              className="animate-rise inline-block italic ink-text"
              style={{ animationDelay: "180ms" }}
            >
              AI video,
            </span>{" "}
            <br className="hidden sm:block" />
            <span
              className="animate-rise inline-block"
              style={{ animationDelay: "300ms" }}
            >
              made for founders.
            </span>
          </h1>

          <p
            className="animate-rise mt-7 max-w-xl text-base text-muted-foreground sm:text-lg"
            style={{ animationDelay: "420ms" }}
          >
            Brief, image, or reference link in. On-brand short-form video out
            — rendered with your colors, your logo, your voice. In minutes,
            not afternoons.
          </p>

          <div
            className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "560ms" }}
          >
            <Link href="/auth/signup">
              <Button size="xl" variant="ink">
                Enter the studio
                <ArrowRightIcon />
              </Button>
            </Link>
            <Link href="#ways">
              <Button size="xl" variant="outline">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
       * PLATFORMS MARQUEE
       * ============================================================ */}
      <section className="relative z-10 border-y border-foreground/10 bg-card/60 py-7">
        <div className="mx-auto mb-4 max-w-6xl px-6">
          <p className="text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Made for every short-form surface
          </p>
        </div>
        <Marquee>
          {platforms.map((p) => (
            <span
              key={p}
              className="font-display text-2xl italic tracking-tight text-foreground/70 sm:text-3xl"
            >
              {p}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ============================================================
       * "THREE WAYS TO START"
       * ============================================================ */}
      <section
        id="ways"
        className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:py-32"
      >
        <div className="mb-14 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Three ways to start a video.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every one of them lands in the same place — a brand-true short,
            saved to your library, sized for every channel.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ways.map((w) => (
            <article
              key={w.eyebrow}
              className="group relative flex flex-col rounded-2xl border border-foreground/10 bg-card p-7 editorial-shadow transition-all hover:-translate-y-0.5 hover:border-foreground/20"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-wider text-muted-foreground">
                  {w.eyebrow}
                </span>
                <div className="inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <w.icon className="size-4" />
                </div>
              </div>
              <h3 className="mt-8 font-display text-2xl tracking-tight">
                {w.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============================================================
       * STUDIOS
       * ============================================================ */}
      <section
        id="studios"
        className="relative z-10 border-t border-foreground/10 bg-secondary/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="mb-14 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Studios
              </p>
              <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
                One workspace, four studios.
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Video is the headline, but a launch needs copy, hero stills, and
              print collateral too. AIV ships them all from one brand kit.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
            {studios.map((s) => (
              <div
                key={s.name}
                className="group flex flex-col gap-6 bg-card p-7 transition-colors hover:bg-card/70"
              >
                <s.icon className="size-5 text-primary" />
                <div>
                  <h3 className="font-display text-2xl tracking-tight">
                    {s.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {s.blurb}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
       * BRAND-AWARE FEATURE
       * ============================================================ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Brand kits
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Set the brand once. <br className="hidden sm:block" />
              <span className="italic ink-text">Reuse everywhere.</span>
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              Logo, primary, accent, body font, voice. Every studio reads from
              the same brand kit, so the copy from your ad and the music in
              your reel both feel like you.
            </p>
            <div className="mt-7">
              <Link href="/auth/signup">
                <Button variant="ink" size="lg">
                  Build your brand kit
                  <ArrowRightIcon />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stylized brand kit preview card */}
          <div className="relative">
            <div className="relative rounded-2xl border border-foreground/10 bg-card p-6 editorial-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Brand kit · preview
                </p>
                <SparklesIcon className="size-3.5 text-primary" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Swatch name="Primary" hex="#1F3A8A" />
                <Swatch name="Bone" hex="#FAF6E8" border />
                <Swatch name="Ink" hex="#0E1230" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-foreground/10 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Display</p>
                  <p className="font-display text-lg">Instrument Serif</p>
                </div>
                <div className="rounded-md border border-foreground/10 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Body</p>
                  <p>Geist Sans</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-md bg-secondary/60 p-3">
                <WandSparklesIcon className="size-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Auto-applied to copy, image, video, and print studios.
                </p>
              </div>
            </div>
            {/* Decorative offset card behind */}
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-2xl bg-primary/8"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * PRICING TEASER
       * ============================================================ */}
      <section
        id="pricing"
        className="relative z-10 border-t border-foreground/10 bg-secondary/40"
      >
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Pay for credits. <br />
            <span className="italic ink-text">Not seats.</span>
          </h2>
          <p className="mt-5 text-muted-foreground">
            Cancel anytime. No per-user tax. The only thing that scales is the
            work you ship.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/billing">
              <Button size="lg" variant="ink">
                See plans
                <ArrowRightIcon />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline">
                Try the studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
       * FOOTER
       * ============================================================ */}
      <footer className="relative z-10 border-t border-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Logo href="/" size="sm" />
            <span className="hidden text-foreground/30 sm:inline">·</span>
            <span>© {new Date().getFullYear()} AIV</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Swatch({
  name,
  hex,
  border = false,
}: {
  name: string;
  hex: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={
          "h-12 rounded-md " + (border ? "border border-foreground/10" : "")
        }
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {name}
        </p>
        <p className="font-mono text-[11px] text-foreground/80">{hex}</p>
      </div>
    </div>
  );
}

# AIV — Brand Guide

> **AIV** is an AI video studio for founders. The brand voice is editorial:
> calm, considered, premium-but-approachable. Think Stripe-grade SaaS with
> a serif-led, newsroom feel — not a luxury boutique, not a bro-startup.

## 1. Name & wordmark

The product name is **AIV** (short for *AI Video*). Always set the wordmark
in **Instrument Serif Italic**, all caps, with the same optical kerning the
font ships with.

| Use                | Set as                  |
| ------------------ | ----------------------- |
| Product name       | AIV                     |
| In-prose / writing | AIV                     |
| Tagline            | *AI video, business-grade.* |
| Long form          | *AI Video Studio for Founders* |

Never:
- Stylize as "A.I.V."
- Set in a sans for the wordmark.
- Pair with another product name (no "AIV Studio", no "AIV Pro").

## 2. Mark

The mark is a serifed play wedge that doubles as the letter A — a triangle
pointing right with a horizontal crossbar. It reads as both **media play**
and **A**, the first letter of the wordmark.

| File                            | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `app/icon.svg`                  | Favicon — works at 16×16                    |
| `app/apple-icon.tsx`            | Apple touch icon (180×180), generated       |
| `app/opengraph-image.tsx`       | Default social share card (1200×630)        |
| `components/app/logo.tsx`       | In-app logo + wordmark composite            |

The mark is always set in **bone (#FAF6E8)** on **ink (#1F3A8A)**, never
inverted. When monochrome is required (print, single-color contexts), the
wedge is solid ink on bone with no crossbar.

## 3. Color

Editorial light is the **primary** mode. Dark is supported as a secondary
mode for studio surfaces (so users can work on dark video in a dark room),
but marketing, billing, and brand material always render in light.

### Light mode (canonical)

| Token              | OKLCH                          | Hex (approx.) | Usage                              |
| ------------------ | ------------------------------ | ------------- | ---------------------------------- |
| `--background`     | `oklch(0.985 0.006 82)`        | `#FAF6E8`     | Page background — bone             |
| `--card`           | `oklch(1 0 0)`                 | `#FFFFFF`     | Cards, modals — pure white         |
| `--foreground`     | `oklch(0.16 0.018 268)`        | `#0E1230`     | Body type — deep charcoal w/ ink   |
| `--muted-foreground` | `oklch(0.46 0.012 268)`      | `#5C6076`     | Captions, metadata                 |
| `--primary`        | `oklch(0.40 0.16 264)`         | `#1F3A8A`     | Brand accent — ink blue            |
| `--border`         | `oklch(0.88 0.008 82)`         | `#DDD6C2`     | Hairline strokes                   |
| `--destructive`    | `oklch(0.55 0.21 27)`          | `#C13B22`     | Error states only                  |

### Dark mode

| Token              | OKLCH                          | Hex (approx.) |
| ------------------ | ------------------------------ | ------------- |
| `--background`     | `oklch(0.13 0.015 270)`        | `#0E1230`     |
| `--card`           | `oklch(0.16 0.015 270)`        | `#141832`     |
| `--foreground`     | `oklch(0.95 0.006 82)`         | `#F0EBDC`     |
| `--primary`        | `oklch(0.72 0.17 260)`         | `#7A98F1`     |

All tokens live in [`app/globals.css`](app/globals.css). Don't hard-code
hex anywhere in the app — use the CSS variables.

## 4. Typography

| Role     | Family            | Weights | Notes                              |
| -------- | ----------------- | ------- | ---------------------------------- |
| Display  | Instrument Serif  | 400     | Italic for emphasis. `font-display`|
| Body     | Geist             | regular | `font-sans` (default)              |
| Mono     | Geist Mono        | regular | Numerals, code, model names        |

Headline rules:
- H1: `text-5xl` to `text-7xl`, `font-display`, `tracking-tight`
- Use *italic* on the keyword in a headline (e.g. "made for *founders*")
  to lean into the editorial voice
- Avoid all-caps display type — reserve uppercase for `tracking-[0.18em]`
  eyebrow labels at `text-xs`

Body rules:
- Body copy is `text-sm` to `text-base`, `text-muted-foreground` for
  supporting paragraphs
- Tabular numerals (`tabular-nums`) for any data, table, or counter

## 5. Voice

| Do                                      | Don't                                  |
| --------------------------------------- | -------------------------------------- |
| "Brief in. Branded video out."          | "Crush your content with AI ✨"         |
| "Editorial-grade short-form, in minutes." | "10x your social game"               |
| Quietly confident                       | Hype-driven                            |
| Plain English, low jargon               | Stack-name-dropping (no "leveraging GPT-X") |

If a sentence would fit in *Monocle* or *the Atlantic*'s product copy,
it fits AIV. If it sounds like Twitter SaaS hype, rewrite it.

## 6. Iconography & motion

- **Icons**: `lucide-react` for UI; never custom illustrations except the
  brand mark itself.
- **Motion**: restrained. One-line `animate-rise` reveal on hero text,
  one marquee on the platform strip, one soft pulse on live indicators.
  No parallax, no cursor splashes, no flashy gradients.

## 7. Surfaces

- Cards: pure white in light mode, hairline border (`--border`),
  `editorial-shadow` for the floating feel. Generous padding — never feel
  cramped.
- Hero: `grid-bg` utility for the subtle 56px graph paper background
  with a fade mask at the bottom.
- Buttons:
  - **Primary**: `variant="ink"` — ink-blue fill on bone, becomes the
    canonical CTA. Pairs with the wordmark.
  - **Outline**: hairline charcoal border, transparent background.
  - **Ghost**: no border, hover bg.
  - The legacy `gold` variant is removed.

## 8. Open Graph & social

The dynamic OG image at `app/opengraph-image.tsx` produces the canonical
1200×630 social card. It's reused for Twitter via `app/twitter-image.tsx`.
Per-segment OG cards (e.g. `/library/[id]/opengraph-image.tsx`) are
permitted but should follow the same layout: bone background, grid
underlay, mark + wordmark top-left, italicized headline middle, meta
strip bottom.

## 9. Don'ts

- No gold. The legacy "Aurum" gold gradient is gone.
- No drop shadows beyond `editorial-shadow`.
- No system blue, no flat material design, no neon.
- No emoji in product UI (allowed in marketing copy *very* sparingly).
- No tagline drift — keep "AI video, business-grade." consistent until
  this guide is updated.

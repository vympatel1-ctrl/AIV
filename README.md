# Aurum Studio · AI Business Content Platform (MVP)

A luxury, dark-mode AI business content studio built on **Next.js 16 App
Router**, **React 19**, **Tailwind v4**, **shadcn/ui**, **Supabase**,
**OpenAI**, **fal.ai**, and **ElevenLabs**.

## What's inside

- **Marketing landing** with a "Sign In" button.
- **Dashboard** with quick actions, recent projects, recent generations.
- **Projects** with folders (categories) + per-project asset grids.
- **Brand Kits** (logo, colors, font).
- **Studio**:
  - **Copy** — hooks, captions, headlines, CTAs, scripts (TikTok / IG / FB / YT).
  - **Image** — `gpt-image-1` with platform aspect ratios.
  - **Video** — provider abstraction (`fal.ai` default; Runway stub) with
    image-to-video and text-to-video. Polls for completion.
  - **Flyer** — flyers and business cards from a prompt + brand inputs.
  - **Voiceover** — ElevenLabs TTS endpoint at `/api/ai/voiceover`.
- **Admin dashboard** — users, daily usage rollups, cost-by-kind,
  moderation queue placeholder.
- **Billing** — pricing-tiers page (Stripe intentionally **not** wired
  for the MVP).

## Mock auth (intentional MVP shortcut)

Real Supabase Auth and Stripe are intentionally skipped. Clicking
**"Sign In"** sets a cookie and routes to `/dashboard`, where every
server-side query uses the Supabase **service role** with a hard-coded
mock user id. When you turn real auth back on:

1. Replace `lib/auth/mock.ts` with the equivalent helper backed by
   `lib/supabase/server.ts` (`supabase.auth.getUser()`).
2. Swap every `createAdminClient()` in `lib/db/*.ts` for the
   cookie-aware server client. RLS will take over.
3. Add a `handle_new_user` trigger on `auth.users` that inserts into
   `public.profiles` (commented out in `schema.sql`).

## Local development

```bash
cp .env.local.example .env.local   # fill in your keys
npm install
npm run build                       # what we verify before pushing
npm run dev
```

## Provisioning

1. **Supabase**: create a project; in the SQL editor, paste and run
   [`supabase/schema.sql`](supabase/schema.sql) once. It creates all
   tables, RLS, two storage buckets (`assets` public, `uploads` private),
   and seeds the mock user profile.
2. **OpenAI**: create an API key with image + chat scope.
3. **fal.ai**: create an API key (`FAL_KEY`).
4. **ElevenLabs**: create an API key. Pick a voice id (default `JBFqnCBsd6RMkjVDRZzb` = "George").
5. Paste all values into `.env.local` (template is `.env.local.example`).

## Deploying to Vercel

```bash
git init
git add .
git commit -m "feat: AI business content MVP"
git remote add origin <your-github-url>
git push -u origin main
```

In Vercel:

1. **Import** the GitHub repo.
2. Paste **all** env vars from `.env.local` into Project → Settings → Environment Variables (Production + Preview).
3. Deploy. The Next.js framework preset is auto-detected.
4. Open the live URL, click **Sign in**, click around the Studio.

## Provider abstraction

Video providers live in `lib/ai/providers/*.ts` and are selected via
`VIDEO_PROVIDER` (default `fal`). Adding Runway / Veo / Kling direct is
a one-file affair — implement `submit()` and `status()` and export
matching `name`.

## Tech notes (Next.js 16 specifics)

- `params` and `searchParams` are async — always `await` them.
- `cookies()` is async — always `await cookies()`.
- Route handlers use `RouteContext<'/path/[id]'>` helper, available globally.
- Tailwind v4 uses `@theme` in `app/globals.css`; there is no
  `tailwind.config.js`.

## Video link import (Studio · From video tab)

Direct `.mp4` / `.webm` URLs and uploaded MP4 files work with **zero
configuration**. Importing from social platforms (TikTok, Instagram,
YouTube, X, Reddit, etc.) requires a **cobalt** instance because those
platforms actively block scrapers — there is no way to do this reliably
from a Vercel function alone.

The app speaks cobalt's native protocol, so any cobalt instance works.

### Local dev (one command)

```bash
cd cobalt && docker compose up -d
```

Then in `.env.local`:

```
VIDEO_INGEST_RESOLVER_URL=http://localhost:9000/
```

Restart `npm run dev`. Paste any TikTok/IG/YT URL in Studio → Video →
*From video* and hit *Import*.

### Production (Railway, ~3 min, free tier)

1. Sign up at [railway.app](https://railway.app), click **New Project**
   → **Deploy from Docker Image**.
2. Image: `ghcr.io/imputnet/cobalt:10`
3. Settings → Networking → **Generate Domain**, copy the public URL.
4. Variables → add `API_URL=https://<your-railway-domain>.up.railway.app/`
   (use the URL from step 3, with trailing slash). Redeploy.
5. In your Vercel project → Settings → Environment Variables, add:
   ```
   VIDEO_INGEST_RESOLVER_URL=https://<your-railway-domain>.up.railway.app/
   ```
6. Redeploy Vercel. Done.

Same shape works on Render, Fly.io, Hetzner, your own VPS — anything
that can run a Docker container. Cobalt is AGPL-licensed.

### Why not just `fetch()` the URL directly?

TikTok, Instagram, and YouTube serve HTML (and an obfuscated, auth-gated
video manifest) when you `fetch()` a video URL. There is no public
endpoint that returns the raw MP4 without either a logged-in browser
session or a project that re-implements each platform's anti-bot
protocol — which is exactly what cobalt does.

If you don't want to host cobalt, the **Upload MP4** button in the same
tab works for any video up to 200 MB.

## What's intentionally TODO

- **Stripe**: subscription checkout + webhook (table is ready).
- **Real Supabase Auth**: scaffolding present; cookie-based `mock` to
  swap.
- **OpenAI moderation** in `/api/ai/*` to populate the moderation queue.
- **PDF export** for flyers (jspdf is installed, plumb into the flyer card).

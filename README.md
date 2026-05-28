# AIV · AI Video Studio for Founders

An editorial, light-mode AI video studio built on **Next.js 16 App
Router**, **React 19**, **Tailwind v4**, **shadcn/ui**, **Supabase**,
**OpenAI**, **fal.ai**, **Runway**, and **ElevenLabs**.

> Brand voice, color, and component guidance live in [`BRAND.md`](BRAND.md).

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

## Auth + billing (live)

- **Auth**: Supabase Auth — email/password + Google OAuth. Session
  refresh runs in `proxy.ts` (Next.js 16's renamed middleware). New
  signups get **200 free credits** via the `handle_new_user` trigger.
- **Billing**: Stripe Checkout for one-off credit packs (Spark $10 /
  Creator $25 / Studio $75 / Scale $200) and a recurring **Pro** plan
  ($29/mo, 3,500 monthly credits). All flows are idempotent and audited
  via the `payments` + `credit_ledger` tables.
- **Pricing math**: 1 credit = $0.01 retail; every generation is priced
  at ~10× our raw API spend, so the gross margin floor is ≥90% even
  after the 25% bonus on the biggest pack.

## Local development

```bash
cp .env.local.example .env.local   # fill in your keys
npm install
npm run build                       # what we verify before pushing
npm run dev
```

## Launch checklist (one-time setup)

1. **Supabase project**
   1. Create the project; copy URL + anon + service role keys into
      `.env.local`.
   2. SQL editor → paste & run [`supabase/schema.sql`](supabase/schema.sql)
      (base tables + RLS + storage buckets).
   3. SQL editor → paste & run
      [`supabase/migrations/002_auth_payments.sql`](supabase/migrations/002_auth_payments.sql)
      (auth trigger, payments, credit ledger).
   4. (Optional) Auto-promote founders to admin on signup:
      `alter database postgres set app.admin_emails = 'you@you.com';`
2. **Supabase Auth**
   1. Authentication → Providers → enable **Email** (turn email
      confirmations on for production).
   2. Authentication → Providers → enable **Google**; paste Google
      OAuth client id + secret (see step 3).
   3. Authentication → URL Configuration → Site URL =
      `https://<your-domain>`, add `https://<your-domain>/auth/callback`
      under "Redirect URLs".
3. **Google OAuth client**
   - Google Cloud Console → APIs & Services → Credentials → create
     OAuth 2.0 Client (Web). Authorized redirect URI =
     `https://<project-ref>.supabase.co/auth/v1/callback`.
4. **OpenAI / fal.ai / ElevenLabs** — create API keys, paste into
   `.env.local`. ElevenLabs default voice = `JBFqnCBsd6RMkjVDRZzb`
   ("George").
5. **Stripe**
   1. Products → create 4 one-time packs and 1 recurring Product for
      Pro at $29/mo. Copy 5 Price IDs into the matching
      `STRIPE_PRICE_*` env vars.
   2. Developers → API keys → copy secret + publishable keys.
   3. Developers → Webhooks → add endpoint
      `https://<your-domain>/api/stripe/webhook` listening for:
      `checkout.session.completed`, `invoice.paid`,
      `customer.subscription.created`, `customer.subscription.updated`,
      `customer.subscription.deleted`. Copy the signing secret into
      `STRIPE_WEBHOOK_SECRET`.
6. **Vercel** — paste every key from `.env.local.example` into Project
   Settings → Environment Variables (Production + Preview), then deploy.

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

- **Priority queue** for Pro subscribers (currently a metadata flag).
- **Refund automation** — refunds happen in the Stripe dashboard;
  webhook can be extended to write a `refund` ledger entry.
- **OpenAI moderation** in `/api/ai/*` to populate the moderation queue.
- **PDF export** for flyers (jspdf is installed, plumb into the flyer
  card).
- **Annual subscription tier** + proration logic.

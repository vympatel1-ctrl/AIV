-- =============================================================
-- Aurum Studio · Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL → New query)
-- It is safe to re-run: every block uses IF [NOT] EXISTS / DROP IF.
-- =============================================================

-- Required extensions ----------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  credits integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- ----------------------------------------------------------------------
-- brand_kits
-- ----------------------------------------------------------------------
create table if not exists public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  primary_color text,
  accent_color text,
  font_family text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brand_kits_user_idx on public.brand_kits(user_id);

-- ----------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  category text,
  cover_url text,
  brand_kit_id uuid references public.brand_kits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id);
create index if not exists projects_category_idx on public.projects(category);

-- ----------------------------------------------------------------------
-- generations
-- ----------------------------------------------------------------------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  kind text not null check (kind in ('copy','image','video','voiceover','flyer')),
  provider text not null,
  model text not null,
  prompt jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','processing','succeeded','failed')),
  external_id text,
  output jsonb,
  error text,
  credits_cost integer not null default 0,
  latency_ms integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists generations_user_idx on public.generations(user_id);
create index if not exists generations_status_idx on public.generations(status);
create index if not exists generations_created_idx on public.generations(created_at desc);

-- ----------------------------------------------------------------------
-- assets
-- ----------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('image','video','copy','flyer','audio')),
  title text,
  content jsonb,
  file_url text,
  thumbnail_url text,
  mime_type text,
  metadata jsonb,
  generation_id uuid references public.generations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assets_user_idx on public.assets(user_id);
create index if not exists assets_project_idx on public.assets(project_id);
create index if not exists assets_type_idx on public.assets(type);

-- ----------------------------------------------------------------------
-- subscriptions  (Stripe wiring is intentionally TODO)
-- ----------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free','starter','pro','business')),
  status text not null default 'active',
  current_period_end timestamptz,
  monthly_credits integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------
-- usage_events
-- ----------------------------------------------------------------------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_id uuid references public.generations(id) on delete set null,
  kind text not null,
  model text not null,
  credits integer not null default 0,
  cost_usd numeric(10,4) not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_idx on public.usage_events(user_id);
create index if not exists usage_events_created_idx on public.usage_events(created_at desc);

-- ----------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

do $$
declare t text;
begin
  for t in select unnest(array['profiles','brand_kits','projects','assets','subscriptions']) loop
    execute format($f$
      drop trigger if exists trg_touch_%I on public.%I;
      create trigger trg_touch_%I before update on public.%I
        for each row execute function public.touch_updated_at();
    $f$, t, t, t, t);
  end loop;
end$$;

-- ----------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.brand_kits    enable row level security;
alter table public.projects      enable row level security;
alter table public.generations   enable row level security;
alter table public.assets        enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events  enable row level security;

-- Helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: user can read/update self; admin can read all
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Generic owner policies for the rest
do $$
declare t text;
begin
  for t in select unnest(array['brand_kits','projects','generations','assets','usage_events','subscriptions']) loop
    execute format($f$
      drop policy if exists "%I_owner_select" on public.%I;
      create policy "%I_owner_select" on public.%I for select
        using (auth.uid() = user_id or public.is_admin());

      drop policy if exists "%I_owner_insert" on public.%I;
      create policy "%I_owner_insert" on public.%I for insert
        with check (auth.uid() = user_id);

      drop policy if exists "%I_owner_update" on public.%I;
      create policy "%I_owner_update" on public.%I for update
        using (auth.uid() = user_id) with check (auth.uid() = user_id);

      drop policy if exists "%I_owner_delete" on public.%I;
      create policy "%I_owner_delete" on public.%I for delete
        using (auth.uid() = user_id);
    $f$, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t);
  end loop;
end$$;

-- ----------------------------------------------------------------------
-- Storage buckets
-- ----------------------------------------------------------------------
-- Public bucket for generated assets.
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Private bucket for raw user uploads (logos, source images for image-to-video, etc.)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- Storage policies: any authenticated user can read public bucket; user owns their objects in uploads.
drop policy if exists "assets_public_read" on storage.objects;
create policy "assets_public_read" on storage.objects for select
  using (bucket_id = 'assets');

drop policy if exists "assets_authenticated_write" on storage.objects;
create policy "assets_authenticated_write" on storage.objects for insert
  with check (bucket_id = 'assets' and auth.role() = 'authenticated');

drop policy if exists "uploads_owner_read" on storage.objects;
create policy "uploads_owner_read" on storage.objects for select
  using (bucket_id = 'uploads' and (auth.uid()::text = owner::text or public.is_admin()));

drop policy if exists "uploads_owner_write" on storage.objects;
create policy "uploads_owner_write" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

drop policy if exists "uploads_owner_delete" on storage.objects;
create policy "uploads_owner_delete" on storage.objects for delete
  using (bucket_id = 'uploads' and auth.uid()::text = owner::text);

-- =============================================================
-- Done. Now plug NEXT_PUBLIC_SUPABASE_URL, anon key, and
-- SUPABASE_SERVICE_ROLE_KEY into your .env.local, then run
-- supabase/migrations/002_auth_payments.sql for the auth +
-- billing tables.
-- =============================================================

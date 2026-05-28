-- =============================================================
-- Migration 002 · Real auth + tokenized billing
-- Run this in the Supabase SQL editor AFTER supabase/schema.sql.
-- Safe to re-run.
-- =============================================================

-- ----------------------------------------------------------------------
-- 1) handle_new_user trigger
--    When Supabase Auth creates a new auth.users row, mint a matching
--    public.profiles row and grant the signup bonus (200 credits).
--    ADMIN_EMAILS may be passed via either an env-driven GUC
--    ('app.admin_emails') or absent; everyone else gets role='user'.
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_csv text;
  full_name_value text;
  resolved_role text;
begin
  -- Read ADMIN_EMAILS from a Postgres GUC if your project set it via
  --   alter database postgres set app.admin_emails = 'a@x.com,b@y.com';
  -- otherwise current_setting returns NULL and nobody is auto-admin.
  begin
    admin_csv := current_setting('app.admin_emails', true);
  exception when others then
    admin_csv := null;
  end;

  full_name_value := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  resolved_role := case
    when admin_csv is not null
         and new.email = any (string_to_array(admin_csv, ','))
      then 'admin'
    else 'user'
  end;

  insert into public.profiles (id, email, full_name, role, credits)
  values (new.id, new.email, full_name_value, resolved_role, 200)
  on conflict (id) do nothing;

  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (new.id, 200, 'signup_bonus', 200)
  on conflict do nothing;

  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------
-- 2) payments
--    One-off Stripe checkouts. Webhook fulfilment is idempotent by
--    stripe_session_id (UNIQUE constraint).
-- ----------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  pack_id text,
  amount_usd numeric(10,2) not null,
  credits_granted integer not null default 0,
  status text not null default 'completed'
    check (status in ('completed','refunded','failed')),
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx
  on public.payments(user_id, created_at desc);

-- ----------------------------------------------------------------------
-- 3) credit_ledger
--    Append-only audit trail. Every credit change writes a row here.
--    `profiles.credits` is a denormalised cache; this is the source of
--    truth for refunds, dispute resolution, and finance reporting.
-- ----------------------------------------------------------------------
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in (
    'signup_bonus',
    'pack_purchase',
    'subscription_grant',
    'generation',
    'refund',
    'admin_adjust'
  )),
  generation_id uuid references public.generations(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  balance_after integer not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx
  on public.credit_ledger(user_id, created_at desc);
create index if not exists credit_ledger_reason_idx
  on public.credit_ledger(reason);

-- Idempotency: only one subscription_grant per (user, invoice_id) pair.
create unique index if not exists credit_ledger_unique_invoice_grant
  on public.credit_ledger ((metadata ->> 'stripe_invoice_id'))
  where reason = 'subscription_grant'
    and (metadata ->> 'stripe_invoice_id') is not null;

-- ----------------------------------------------------------------------
-- 4) Extend subscriptions with the Stripe fields the webhook needs.
-- ----------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists stripe_price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

-- ----------------------------------------------------------------------
-- 5) Row Level Security
--    Owners (and admins) can read their payments + ledger.
--    All writes happen via the service role (Stripe webhook), which
--    bypasses RLS by design.
-- ----------------------------------------------------------------------
alter table public.payments      enable row level security;
alter table public.credit_ledger enable row level security;

drop policy if exists "payments_owner_read" on public.payments;
create policy "payments_owner_read" on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "credit_ledger_owner_read" on public.credit_ledger;
create policy "credit_ledger_owner_read" on public.credit_ledger for select
  using (auth.uid() = user_id or public.is_admin());

-- =============================================================
-- Done. Next steps (one-time, in the Supabase dashboard):
--   1. Auth → Providers → enable Email + Google (paste client id/secret).
--   2. Auth → URL Configuration → set Site URL and add
--      https://<your-domain>/auth/callback to redirect URLs.
--   3. (Optional) To auto-promote founders to admin on signup:
--        alter database postgres set app.admin_emails = 'you@you.com';
-- =============================================================

-- ============================================================
-- Migration 003 — time tracking: check-in/out, breaks,
-- manual adjustments, monthly contract hours
-- (merged into schema.sql for fresh installs)
-- ============================================================

-- Full-time contract target, asked at onboarding; drives overtime calculation
alter table public.profiles
  add column if not exists monthly_hours numeric;

-- One row per work session (check-in → check-out)
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists time_entries_user_idx on public.time_entries (user_id, clock_in desc);

-- Breaks within a session (pause → resume)
create table if not exists public.time_entry_breaks (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  break_start timestamptz not null default now(),
  break_end timestamptz
);

-- Manual +/- minutes per employee per month (negotiated corrections)
create table if not exists public.time_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null, -- first day of the month it applies to
  minutes int not null, -- positive or negative
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.time_entries enable row level security;
create policy te_select on public.time_entries for select to authenticated
  using (
    user_id = (select auth.uid())
    or (app.is_manager() and exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = app.me_org()))
  );
create policy te_insert on public.time_entries for insert to authenticated
  with check (user_id = (select auth.uid()) or app.is_manager());
create policy te_update on public.time_entries for update to authenticated
  using (
    user_id = (select auth.uid())
    or (app.is_manager() and exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = app.me_org()))
  )
  with check (
    user_id = (select auth.uid())
    or (app.is_manager() and exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = app.me_org()))
  );
create policy te_delete on public.time_entries for delete to authenticated
  using (app.is_manager() and exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = app.me_org()));

alter table public.time_entry_breaks enable row level security;
create policy teb_all on public.time_entry_breaks for all to authenticated
  using (exists (
    select 1 from public.time_entries te
    where te.id = time_entry_id
      and (te.user_id = (select auth.uid()) or app.is_manager())
  ))
  with check (exists (
    select 1 from public.time_entries te
    where te.id = time_entry_id
      and (te.user_id = (select auth.uid()) or app.is_manager())
  ));

alter table public.time_adjustments enable row level security;
create policy ta_select on public.time_adjustments for select to authenticated
  using (
    user_id = (select auth.uid())
    or (app.is_manager() and exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = app.me_org()))
  );
create policy ta_write on public.time_adjustments for all to authenticated
  using (app.is_manager() and exists (select 1 from public.profiles p where p.id = user_id and p.organization_id = app.me_org()))
  with check (app.is_manager() and created_by = (select auth.uid()));

grant select, insert, update, delete on public.time_entries, public.time_entry_breaks, public.time_adjustments to authenticated;

-- Demo: full-time employees get a 160h/month contract target
update public.profiles set monthly_hours = 160
  where contract_type = 'full_time' and monthly_hours is null and role = 'employee';

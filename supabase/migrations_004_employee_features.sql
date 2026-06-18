-- ============================================================
-- Migration 004 — Employee features: chat, reports, learning progress
--
-- Adds:
--   1. Chat        conversations, conversation_members, messages (DMs + location channels)
--   2. Reports     employee-submitted reports (whistleblower, end-of-day, temperature, broken item)
--   3. Learning    lesson_completions (hub onboarding / academy progress)
--
-- Run AFTER schema.sql (uses app.* helper functions and existing tables).
-- Idempotent-ish: guarded with if-not-exists where possible.
-- ============================================================

-- ---------- Enums ----------
do $$ begin
  create type public.conversation_kind as enum ('dm','channel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_kind as enum ('whistleblower','end_of_day','temperature','broken_item');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open','in_review','resolved');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 1. CHAT
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- set for location-wide channels (one auto channel per location); null for DMs
  location_id uuid references public.locations(id) on delete cascade,
  kind public.conversation_kind not null default 'dm',
  title text,                       -- channel name; null for DMs (derived from members)
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);
create index if not exists idx_conversation_members_profile on public.conversation_members (profile_id);
create index if not exists idx_conversations_org on public.conversations (organization_id);
-- exactly one auto-created team channel per location
create unique index if not exists idx_conversations_location_channel
  on public.conversations (location_id) where kind = 'channel';

-- membership check used by RLS (security definer avoids policy self-recursion
-- on conversation_members)
create or replace function app.is_conversation_member(conv uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (
     select 1 from public.conversation_members
     where conversation_id = conv and profile_id = auth.uid()
   ) $$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- conversations: members read; any org member may create (DMs); managers manage
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select to authenticated
  using (app.is_conversation_member(id) or (app.is_manager() and organization_id = app.me_org()));
drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert to authenticated
  with check (organization_id = app.me_org() and created_by = auth.uid());

-- members: visible to fellow members; users join/leave themselves; creators add the
-- other party when starting a DM; managers manage channel membership
drop policy if exists conv_members_select on public.conversation_members;
create policy conv_members_select on public.conversation_members for select to authenticated
  using (profile_id = auth.uid() or app.is_conversation_member(conversation_id)
         or (app.is_manager() and exists (select 1 from public.conversations c
              where c.id = conversation_id and c.organization_id = app.me_org())));
drop policy if exists conv_members_insert on public.conversation_members;
create policy conv_members_insert on public.conversation_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    or exists (select 1 from public.conversations c
               where c.id = conversation_id and c.created_by = auth.uid())
    or (app.is_manager() and exists (select 1 from public.conversations c
        where c.id = conversation_id and c.organization_id = app.me_org()))
  );
drop policy if exists conv_members_update on public.conversation_members;
create policy conv_members_update on public.conversation_members for update to authenticated
  using (profile_id = auth.uid());
drop policy if exists conv_members_delete on public.conversation_members;
create policy conv_members_delete on public.conversation_members for delete to authenticated
  using (profile_id = auth.uid()
         or (app.is_manager() and exists (select 1 from public.conversations c
             where c.id = conversation_id and c.organization_id = app.me_org())));

-- messages: members read + write into their conversations
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (app.is_conversation_member(conversation_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and app.is_conversation_member(conversation_id));

-- realtime for live chat
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. REPORTS
-- ============================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  -- null when submitted anonymously (whistleblower)
  reporter_id uuid references public.profiles(id) on delete set null,
  kind public.report_kind not null,
  is_anonymous boolean not null default false,
  subject text not null default '',
  -- flexible per-kind answers, e.g. {"item":"Fridge 2","temperature":"9C","details":"..."}
  body jsonb not null default '{}'::jsonb,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_org_created on public.reports (organization_id, created_at desc);
create index if not exists idx_reports_reporter on public.reports (reporter_id);

alter table public.reports enable row level security;

-- insert: any org member; anonymous rows must not carry a reporter id
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated
  with check (
    organization_id = app.me_org()
    and ((is_anonymous and reporter_id is null) or reporter_id = auth.uid())
  );
-- select: own reports; managers see org reports EXCEPT whistleblower, which only admins see
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or (organization_id = app.me_org()
        and ((kind <> 'whistleblower' and app.is_manager()) or app.is_admin()))
  );
-- update (status/resolution): managers, admins for whistleblower
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update to authenticated
  using (organization_id = app.me_org()
         and ((kind <> 'whistleblower' and app.is_manager()) or app.is_admin()));

-- ============================================================
-- 3. LEARNING PROGRESS
-- ============================================================

create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- stable key per lesson/quiz, e.g. 'welcome.about-us.history' or 'welcome.quiz'
  lesson_key text not null,
  score numeric,
  completed_at timestamptz not null default now(),
  unique (profile_id, lesson_key)
);

create index if not exists idx_lesson_completions_profile on public.lesson_completions (profile_id);

alter table public.lesson_completions enable row level security;

drop policy if exists lesson_completions_self on public.lesson_completions;
create policy lesson_completions_self on public.lesson_completions for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists lesson_completions_managers on public.lesson_completions;
create policy lesson_completions_managers on public.lesson_completions for select to authenticated
  using (app.is_manager() and exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.organization_id = app.me_org()
  ));

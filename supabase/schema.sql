-- ============================================================
-- SessionPilot Ops — Complete Database Schema
-- Multi-location restaurant operations management (Supabase / Postgres)
--
-- This single file provisions the entire backend. Run it ONCE on a fresh
-- Supabase project (SQL Editor or `psql`), then run supabase/seed.sql for the
-- PK Foods Group demo data, then `node scripts/setup-demo.mjs` for auth users.
--
-- Contents (in dependency order):
--   1.  Enums            roles, statuses, recurrence, contracts, etc.
--   2.  Org structure    organizations → brands → locations, departments, job_roles
--   3.  People           profiles (1:1 with auth.users) incl. contract + letter fields
--   4.  Catalog          responsibilities, job_role_responsibilities, location_required_roles
--   5.  SOPs             sops + sop_steps (with file/url attachments)
--   6.  Tasks            task_templates (recurrence) → task_instances → completions/evidence/approvals
--   7.  Scheduling       shifts, holidays, events + attendance
--   8.  Time tracking    time_entries, time_entry_breaks, time_adjustments
--   9.  Comms            posts (+urgent broadcasts), notifications, audit_logs (immutable)
--   10. Companies        legal entities for employment documents / offer letters
--   11. Helper fns       app.me_role/me_org/is_manager + task generation + manager notify
--   12. RLS              row-level security policies for all five roles
--   13. Storage          evidence / avatars / attachments / posts buckets
--
-- Roles: super_admin · org_admin · restaurant_manager · shift_manager · employee
-- ============================================================

-- ---------- Enums ----------
create type public.user_role as enum ('super_admin','org_admin','restaurant_manager','shift_manager','employee');
create type public.employee_status as enum ('active','inactive','on_leave','suspended');
-- 'completed' = finished without manager review (template.requires_approval = false)
create type public.task_status as enum ('pending','in_progress','submitted','approved','rejected','overdue','completed');
create type public.recurrence_type as enum ('once','daily','weekly','monthly','custom');
create type public.priority_level as enum ('low','medium','high','critical');
create type public.evidence_kind as enum ('photo','video','file','note');
create type public.notification_kind as enum ('task_assigned','task_reminder','task_overdue','task_approved','task_rejected','escalation','shift_assigned','event','general');
create type public.assignment_mode as enum ('individual','job_role','location');
create type public.contract_type as enum ('full_time','hourly');

-- ---------- Core org structure ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  address text, city text, postal_code text, country text,
  phone text, email text,
  -- Feature flags (admin-controlled)
  chat_enabled boolean not null default false,
  -- require scanning the restaurant's rotating QR to clock in (anti-spoofing)
  attendance_qr_required boolean not null default false,
  -- per-location secret for signing the rotating attendance token
  attendance_secret text,
  -- unguessable key for the public QR display URL (/display/<key>)
  display_key text unique,
  -- {"1":{"open":"10:00","close":"22:00"}, ... "7":null} — ISO weekday keys, null = closed
  opening_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.job_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- null = universal (all locations); set = restaurant-specific
  location_id uuid references public.locations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ---------- People ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  job_role_id uuid references public.job_roles(id) on delete set null,
  role public.user_role not null default 'employee',
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  personal_number text,
  date_of_birth date,
  employee_id text,
  position text,
  hire_date date,
  status public.employee_status not null default 'active',
  contract_type public.contract_type not null default 'full_time',
  hourly_rate numeric,
  -- contract hours per month (full-time) — drives overtime calculation
  monthly_hours numeric,
  -- employment-letter fields (home address, paygrade, salary, employment terms)
  address text,
  postal_code text,
  city text,
  pay_group text,
  monthly_salary numeric,
  employment_form text,
  employment_end date,
  occupation_code text,
  bank_account text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- ---------- Responsibilities ----------
create table public.responsibilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- null = universal (all locations); set = restaurant-specific
  location_id uuid references public.locations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  description text,
  estimated_minutes int,
  priority public.priority_level not null default 'medium',
  created_at timestamptz not null default now()
);

-- A job role can carry one or more responsibilities
create table public.job_role_responsibilities (
  job_role_id uuid not null references public.job_roles(id) on delete cascade,
  responsibility_id uuid not null references public.responsibilities(id) on delete cascade,
  primary key (job_role_id, responsibility_id)
);

-- Roles a restaurant needs covered on its schedule (drives the shift planner)
create table public.location_required_roles (
  location_id uuid not null references public.locations(id) on delete cascade,
  job_role_id uuid not null references public.job_roles(id) on delete cascade,
  primary key (location_id, job_role_id)
);

-- ---------- SOPs ----------
create table public.sops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  description text,
  category text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sop_steps (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid not null references public.sops(id) on delete cascade,
  step_number int not null,
  title text not null,
  description text,
  -- [{type:'image'|'video'|'pdf'|'link', url, label}]
  attachments jsonb not null default '[]'::jsonb
);

-- ---------- Task templates & scheduling ----------
create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  sop_id uuid references public.sops(id) on delete set null,
  responsibility_id uuid references public.responsibilities(id) on delete set null,
  name text not null,
  description text,
  recurrence public.recurrence_type not null default 'daily',
  -- weekly: {weekdays:[1..7]} / monthly: {day_of_month:1} / custom: {every_n_days:3}
  recurrence_config jsonb not null default '{}'::jsonb,
  due_time time not null default '17:00',
  priority public.priority_level not null default 'medium',
  requires_evidence boolean not null default false,
  evidence_kind public.evidence_kind not null default 'photo',
  -- when false, submitting completes the task immediately (no manager review)
  requires_approval boolean not null default false,
  assignment_mode public.assignment_mode not null default 'location',
  assigned_job_role_id uuid references public.job_roles(id) on delete set null,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- explicit assignees for individual / multi-person assignment
create table public.task_template_assignees (
  template_id uuid not null references public.task_templates(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (template_id, user_id)
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.task_templates(id) on delete cascade,
  label text not null,
  mandatory boolean not null default true,
  requires_evidence boolean not null default false,
  sort_order int not null default 0
);

-- ---------- Task instances (generated per due date) ----------
create table public.task_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.task_templates(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  due_date date not null,
  due_at timestamptz not null,
  status public.task_status not null default 'pending',
  submitted_at timestamptz,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (template_id, due_date)
);

create table public.task_assignees (
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_instance_id, user_id)
);

create table public.item_completions (
  id uuid primary key default gen_random_uuid(),
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items(id) on delete cascade,
  completed boolean not null default true,
  comment text,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz not null default now(),
  unique (task_instance_id, checklist_item_id)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  checklist_item_id uuid references public.checklist_items(id) on delete set null,
  kind public.evidence_kind not null default 'photo',
  storage_path text,
  note text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  decision text not null check (decision in ('approved','rejected')),
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- Shifts (daily work schedule) ----------
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  role_label text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Holidays (location_id null = all locations) ----------
create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  date date not null,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.locations(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.event_attendance (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'joining' check (status in ('joining','declined')),
  primary key (event_id, user_id)
);

-- ---------- Notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.notification_kind not null default 'general',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Audit log (immutable) ----------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Feed (kept from reference app) ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  is_important boolean not null default false,
  -- crisis broadcast: full-screen overlay for all users until they swipe it away
  is_urgent boolean not null default false,
  content text,
  image_url text,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions (private schema, used by RLS)
-- ============================================================
create schema if not exists app;

create or replace function app.me_role() returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function app.me_org() returns uuid
language sql stable security definer set search_path = public
as $$ select organization_id from public.profiles where id = auth.uid() $$;

create or replace function app.me_location() returns uuid
language sql stable security definer set search_path = public
as $$ select location_id from public.profiles where id = auth.uid() $$;

create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()) in ('super_admin','org_admin'), false) $$;

create or replace function app.is_manager() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()) in ('super_admin','org_admin','restaurant_manager','shift_manager'), false) $$;

grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;

-- Auto-create profile on signup (metadata only used at creation time)
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name','')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ============================================================
-- Task instance generation (called by managers / dashboard load)
-- Creates instances due on p_date from active templates, assigns
-- users, notifies them, and flags overdue instances.
-- ============================================================
create or replace function public.generate_task_instances(p_date date)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  t record;
  v_instance_id uuid;
  v_count int := 0;
  v_due boolean;
begin
  if not app.is_manager() then
    raise exception 'not authorized';
  end if;

  for t in
    select * from task_templates
    where active = true and organization_id = app.me_org()
  loop
    -- no tasks on holidays (location-specific or org-wide)
    if exists (
      select 1 from holidays h
      where h.date = p_date
        and h.organization_id = t.organization_id
        and (h.location_id is null or t.location_id is null or h.location_id = t.location_id)
    ) then
      continue;
    end if;

    v_due := case t.recurrence
      when 'daily' then true
      when 'once' then coalesce((t.recurrence_config->>'date')::date = p_date, false)
      when 'weekly' then (t.recurrence_config->'weekdays') @> to_jsonb(extract(isodow from p_date)::int)
      when 'monthly' then coalesce((t.recurrence_config->>'day_of_month')::int, 1) = extract(day from p_date)::int
      when 'custom' then coalesce(
        (p_date - coalesce((t.recurrence_config->>'start_date')::date, t.created_at::date))
          % nullif((t.recurrence_config->>'every_n_days')::int, 0) = 0, false)
      else false end;

    if not v_due then continue; end if;

    insert into task_instances (template_id, location_id, due_date, due_at, status)
    values (t.id, t.location_id, p_date, (p_date + t.due_time)::timestamptz, 'pending')
    on conflict (template_id, due_date) do nothing
    returning id into v_instance_id;

    if v_instance_id is null then continue; end if;
    v_count := v_count + 1;

    -- assign users
    if t.assignment_mode = 'individual' then
      insert into task_assignees (task_instance_id, user_id)
      select v_instance_id, user_id from task_template_assignees where template_id = t.id;
    elsif t.assignment_mode = 'job_role' then
      insert into task_assignees (task_instance_id, user_id)
      select v_instance_id, p.id from profiles p
      where p.job_role_id = t.assigned_job_role_id
        and (t.location_id is null or p.location_id = t.location_id)
        and p.status = 'active';
    else -- location: all active employees at the location
      insert into task_assignees (task_instance_id, user_id)
      select v_instance_id, p.id from profiles p
      where p.location_id = t.location_id and p.status = 'active';
    end if;

    -- notify assignees
    insert into notifications (user_id, kind, title, body, link)
    select ta.user_id, 'task_assigned', 'New task: ' || t.name,
           'Due ' || to_char(p_date, 'DD Mon') || ' at ' || to_char(t.due_time, 'HH24:MI'),
           '/tasks/' || v_instance_id
    from task_assignees ta where ta.task_instance_id = v_instance_id;
  end loop;

  -- flag overdue + escalate (once, on transition)
  with flagged as (
    update task_instances
    set status = 'overdue'
    where status in ('pending','in_progress') and due_at < now()
    returning id, template_id
  )
  insert into notifications (user_id, kind, title, body, link)
  select p.id, 'escalation', 'Task overdue: ' || tt.name,
         'A task at your location is overdue and needs attention.',
         '/admin/approvals'
  from flagged f
  join task_templates tt on tt.id = f.template_id
  join profiles p on p.role in ('restaurant_manager','shift_manager')
    and p.organization_id = tt.organization_id
    and (tt.location_id is null or p.location_id = tt.location_id);

  return v_count;
end $$;

revoke execute on function public.generate_task_instances(date) from public, anon;
grant execute on function public.generate_task_instances(date) to authenticated;

-- Notify managers of a location (used when an employee submits a task —
-- employees cannot insert notifications for other users directly under RLS).
create or replace function public.notify_managers(
  p_location uuid,
  p_kind public.notification_kind,
  p_title text,
  p_body text,
  p_link text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into notifications (user_id, kind, title, body, link)
  select p.id, p_kind, p_title, p_body, p_link
  from profiles p
  where p.role in ('restaurant_manager','shift_manager','org_admin')
    and p.organization_id = (select organization_id from profiles where id = auth.uid())
    and (p.role = 'org_admin' or p.location_id = p_location or p_location is null);
end $$;

revoke execute on function public.notify_managers(uuid, public.notification_kind, text, text, text) from public, anon;
grant execute on function public.notify_managers(uuid, public.notification_kind, text, text, text) to authenticated;

-- ============================================================
-- Grants (new tables are not auto-exposed to the Data API)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.organizations enable row level security;
alter table public.brands enable row level security;
alter table public.locations enable row level security;
alter table public.departments enable row level security;
alter table public.job_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.responsibilities enable row level security;
alter table public.sops enable row level security;
alter table public.sop_steps enable row level security;
alter table public.task_templates enable row level security;
alter table public.task_template_assignees enable row level security;
alter table public.checklist_items enable row level security;
alter table public.task_instances enable row level security;
alter table public.task_assignees enable row level security;
alter table public.item_completions enable row level security;
alter table public.evidence enable row level security;
alter table public.approvals enable row level security;
alter table public.shifts enable row level security;
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.posts enable row level security;
alter table public.job_role_responsibilities enable row level security;
alter table public.location_required_roles enable row level security;
alter table public.holidays enable row level security;

-- organizations: members read; super_admin writes
create policy org_select on public.organizations for select to authenticated
  using (id = app.me_org() or app.me_role() = 'super_admin');
create policy org_write on public.organizations for all to authenticated
  using (app.me_role() = 'super_admin') with check (app.me_role() = 'super_admin');

-- brands / locations / departments / job_roles: org members read; admins write
create policy brands_select on public.brands for select to authenticated using (organization_id = app.me_org());
create policy brands_write on public.brands for all to authenticated
  using (app.is_admin() and organization_id = app.me_org())
  with check (app.is_admin() and organization_id = app.me_org());

create policy locations_select on public.locations for select to authenticated using (organization_id = app.me_org());
create policy locations_write on public.locations for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

create policy departments_select on public.departments for select to authenticated using (organization_id = app.me_org());
create policy departments_write on public.departments for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

create policy job_roles_select on public.job_roles for select to authenticated using (organization_id = app.me_org());
create policy job_roles_write on public.job_roles for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

-- profiles: see own + same-org; managers manage; self can update own row
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or organization_id = app.me_org());
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_manager_update on public.profiles for update to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager());
create policy profiles_manager_insert on public.profiles for insert to authenticated
  with check (app.is_manager());
create policy profiles_manager_delete on public.profiles for delete to authenticated
  using (app.is_manager() and organization_id = app.me_org());

-- responsibilities / sops / sop_steps: org read; managers write
create policy resp_select on public.responsibilities for select to authenticated using (organization_id = app.me_org());
create policy resp_write on public.responsibilities for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

create policy sops_select on public.sops for select to authenticated using (organization_id = app.me_org());
create policy sops_write on public.sops for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

create policy sop_steps_select on public.sop_steps for select to authenticated
  using (exists (select 1 from public.sops s where s.id = sop_id and s.organization_id = app.me_org()));
create policy sop_steps_write on public.sop_steps for all to authenticated
  using (app.is_manager() and exists (select 1 from public.sops s where s.id = sop_id and s.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.sops s where s.id = sop_id and s.organization_id = app.me_org()));

-- task templates & checklist items: org read; managers write
create policy templates_select on public.task_templates for select to authenticated using (organization_id = app.me_org());
create policy templates_write on public.task_templates for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

create policy tta_select on public.task_template_assignees for select to authenticated
  using (exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()));
create policy tta_write on public.task_template_assignees for all to authenticated
  using (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()));

create policy items_select on public.checklist_items for select to authenticated
  using (exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()));
create policy items_write on public.checklist_items for all to authenticated
  using (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()));

-- task instances: assignees + same-org managers read; assignees update status; managers all
create policy instances_select on public.task_instances for select to authenticated
  using (
    exists (select 1 from public.task_assignees a where a.task_instance_id = id and a.user_id = (select auth.uid()))
    or (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()))
  );
create policy instances_update_assignee on public.task_instances for update to authenticated
  using (exists (select 1 from public.task_assignees a where a.task_instance_id = id and a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.task_assignees a where a.task_instance_id = id and a.user_id = (select auth.uid())));
create policy instances_manager_all on public.task_instances for all to authenticated
  using (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.task_templates t where t.id = template_id and t.organization_id = app.me_org()));

create policy assignees_select on public.task_assignees for select to authenticated
  using (user_id = (select auth.uid()) or app.is_manager());
create policy assignees_write on public.task_assignees for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

-- completions / evidence: assignees insert their own; org read
create policy completions_select on public.item_completions for select to authenticated
  using (exists (select 1 from public.task_instances i where i.id = task_instance_id));
create policy completions_insert on public.item_completions for insert to authenticated
  with check (
    completed_by = (select auth.uid())
    and exists (select 1 from public.task_assignees a where a.task_instance_id = item_completions.task_instance_id and a.user_id = (select auth.uid()))
  );
create policy completions_update on public.item_completions for update to authenticated
  using (completed_by = (select auth.uid())) with check (completed_by = (select auth.uid()));
create policy completions_delete on public.item_completions for delete to authenticated
  using (completed_by = (select auth.uid()) or app.is_manager());

create policy evidence_select on public.evidence for select to authenticated
  using (exists (select 1 from public.task_instances i where i.id = task_instance_id));
create policy evidence_insert on public.evidence for insert to authenticated
  with check (uploaded_by = (select auth.uid()));
create policy evidence_delete on public.evidence for delete to authenticated
  using (uploaded_by = (select auth.uid()) or app.is_manager());

-- approvals: managers write; visible to task viewers
create policy approvals_select on public.approvals for select to authenticated
  using (exists (select 1 from public.task_instances i where i.id = task_instance_id));
create policy approvals_insert on public.approvals for insert to authenticated
  with check (app.is_manager() and reviewed_by = (select auth.uid()));

-- shifts: own + managers of same org
create policy shifts_select on public.shifts for select to authenticated
  using (user_id = (select auth.uid()) or (app.is_manager() and exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org())));
create policy shifts_write on public.shifts for all to authenticated
  using (app.is_manager() and exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org()));

-- events: org read; managers write; attendance own
create policy events_select on public.events for select to authenticated
  using (organization_id = app.me_org() or exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org()));
create policy events_write on public.events for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy attendance_select on public.event_attendance for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id));
create policy attendance_own on public.event_attendance for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- notifications: own only (managers may insert for others via functions)
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_insert on public.notifications for insert to authenticated
  with check (user_id = (select auth.uid()) or app.is_manager());

-- audit logs: immutable — insert own; managers read; no update/delete
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (actor_id = (select auth.uid()));
create policy audit_select on public.audit_logs for select to authenticated
  using (app.is_manager() and organization_id = app.me_org());
revoke update, delete on public.audit_logs from authenticated;

-- posts: org members read/insert; author or manager update/delete
create policy posts_select on public.posts for select to authenticated using (organization_id = app.me_org());
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()) and organization_id = app.me_org());
create policy posts_update on public.posts for update to authenticated
  using (organization_id = app.me_org())
  with check (organization_id = app.me_org());
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = (select auth.uid()) or app.is_manager());

-- job role ↔ responsibilities links: org read; managers write
create policy jrr_select on public.job_role_responsibilities for select to authenticated
  using (exists (select 1 from public.job_roles jr where jr.id = job_role_id and jr.organization_id = app.me_org()));
create policy jrr_write on public.job_role_responsibilities for all to authenticated
  using (app.is_manager() and exists (select 1 from public.job_roles jr where jr.id = job_role_id and jr.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.job_roles jr where jr.id = job_role_id and jr.organization_id = app.me_org()));

-- required roles per location: org read; managers write
create policy lrr_select on public.location_required_roles for select to authenticated
  using (exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org()));
create policy lrr_write on public.location_required_roles for all to authenticated
  using (app.is_manager() and exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.locations l where l.id = location_id and l.organization_id = app.me_org()));

-- holidays: org read; managers write
create policy holidays_select on public.holidays for select to authenticated
  using (organization_id = app.me_org());
create policy holidays_write on public.holidays for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

-- Legal entities used on employment documents (an org can have several)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  org_number text,
  address text,
  postal_code text,
  city text,
  country text default 'Sweden',
  phone text,
  email text,
  workplace text,
  collective_agreement text default 'HRF',
  signatory_name text,
  signatory_title text,
  payday text,
  created_at timestamptz not null default now()
);
alter table public.companies enable row level security;
create policy companies_select on public.companies for select to authenticated
  using (organization_id = app.me_org());
create policy companies_write on public.companies for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

-- Per-user dismissal of urgent (crisis) posts
create table public.urgent_dismissals (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.urgent_dismissals enable row level security;
create policy ud_select on public.urgent_dismissals for select to authenticated
  using (user_id = (select auth.uid()));
create policy ud_insert on public.urgent_dismissals for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ============================================================
-- Time tracking: check-in/out sessions, breaks, manual adjustments
-- ============================================================
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  created_at timestamptz not null default now()
);
create index time_entries_user_idx on public.time_entries (user_id, clock_in desc);

create table public.time_entry_breaks (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  break_start timestamptz not null default now(),
  break_end timestamptz
);

-- Manual +/- minutes per employee per month (negotiated corrections)
create table public.time_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  minutes int not null,
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

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
    where te.id = time_entry_id and (te.user_id = (select auth.uid()) or app.is_manager())
  ))
  with check (exists (
    select 1 from public.time_entries te
    where te.id = time_entry_id and (te.user_id = (select auth.uid()) or app.is_manager())
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

-- ============================================================
-- Storage buckets + policies
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('evidence', 'evidence', false),
  ('avatars', 'avatars', true),
  ('attachments', 'attachments', true),
  ('posts', 'posts', true)
on conflict (id) do nothing;

create policy storage_read on storage.objects for select to authenticated
  using (bucket_id in ('evidence','avatars','attachments','posts'));
create policy storage_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('evidence','avatars','attachments','posts'));
create policy storage_update on storage.objects for update to authenticated
  using (owner_id::uuid = (select auth.uid()))
  with check (owner_id::uuid = (select auth.uid()));
create policy storage_delete on storage.objects for delete to authenticated
  using (owner_id::uuid = (select auth.uid()));

-- ---------- Handbook Stories ----------
create table public.handbook_stories (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid references public.locations(id) on delete cascade,
    title text not null,
    image_url text,
    content_bullets text,
    created_at timestamptz not null default now()
);

alter table public.handbook_stories enable row level security;

create policy "Allow read access to handbook stories for authenticated users" 
on public.handbook_stories for select to authenticated using (true);

-- ---------- Handbook Needs ----------
create table public.handbook_needs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid references public.locations(id) on delete cascade,
    title text not null,
    content_bullets text,
    created_at timestamptz not null default now()
);

alter table public.handbook_needs enable row level security;

create policy "Allow read access to handbook needs for authenticated users" 
on public.handbook_needs for select to public using (true);

-- ---------- Handbook Rules ----------
create table public.handbook_rules (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid references public.locations(id) on delete cascade,
    title text not null,
    content_bullets text,
    created_at timestamptz not null default now()
);

alter table public.handbook_rules enable row level security;

create policy "Allow read access to handbook rules" 
on public.handbook_rules for select to public using (true);

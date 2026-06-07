-- ============================================================
-- Migration 002 — opening hours, holidays, contracts, scoped catalogs
-- (already merged into schema.sql for fresh installs)
-- ============================================================

-- Employee contracts
create type public.contract_type as enum ('full_time','hourly');
alter table public.profiles
  add column if not exists contract_type public.contract_type not null default 'full_time',
  add column if not exists hourly_rate numeric;

-- Opening hours per location: {"1":{"open":"10:00","close":"22:00"}, ... "7":null}
-- keys are ISO weekday (1=Mon..7=Sun); null/absent = closed that day
alter table public.locations
  add column if not exists opening_hours jsonb not null default '{}'::jsonb;

-- Catalog scoping: null = universal (all locations), set = restaurant-specific
alter table public.job_roles
  add column if not exists location_id uuid references public.locations(id) on delete cascade;
alter table public.responsibilities
  add column if not exists location_id uuid references public.locations(id) on delete cascade;

-- A job role can carry one or more responsibilities
create table if not exists public.job_role_responsibilities (
  job_role_id uuid not null references public.job_roles(id) on delete cascade,
  responsibility_id uuid not null references public.responsibilities(id) on delete cascade,
  primary key (job_role_id, responsibility_id)
);

-- Holidays: location_id null = applies to ALL locations in the org
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  date date not null,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.job_role_responsibilities enable row level security;
create policy jrr_select on public.job_role_responsibilities for select to authenticated
  using (exists (select 1 from public.job_roles jr where jr.id = job_role_id and jr.organization_id = app.me_org()));
create policy jrr_write on public.job_role_responsibilities for all to authenticated
  using (app.is_manager() and exists (select 1 from public.job_roles jr where jr.id = job_role_id and jr.organization_id = app.me_org()))
  with check (app.is_manager() and exists (select 1 from public.job_roles jr where jr.id = job_role_id and jr.organization_id = app.me_org()));

alter table public.holidays enable row level security;
create policy holidays_select on public.holidays for select to authenticated
  using (organization_id = app.me_org());
create policy holidays_write on public.holidays for all to authenticated
  using (app.is_manager() and organization_id = app.me_org())
  with check (app.is_manager() and organization_id = app.me_org());

grant select, insert, update, delete on public.job_role_responsibilities, public.holidays to authenticated;

-- generate_task_instances: skip dates that are holidays for the template's location
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

    if t.assignment_mode = 'individual' then
      insert into task_assignees (task_instance_id, user_id)
      select v_instance_id, user_id from task_template_assignees where template_id = t.id;
    elsif t.assignment_mode = 'job_role' then
      insert into task_assignees (task_instance_id, user_id)
      select v_instance_id, p.id from profiles p
      where p.job_role_id = t.assigned_job_role_id
        and (t.location_id is null or p.location_id = t.location_id)
        and p.status = 'active';
    else
      insert into task_assignees (task_instance_id, user_id)
      select v_instance_id, p.id from profiles p
      where p.location_id = t.location_id and p.status = 'active';
    end if;

    insert into notifications (user_id, kind, title, body, link)
    select ta.user_id, 'task_assigned', 'New task: ' || t.name,
           'Due ' || to_char(p_date, 'DD Mon') || ' at ' || to_char(t.due_time, 'HH24:MI'),
           '/tasks/' || v_instance_id
    from task_assignees ta where ta.task_instance_id = v_instance_id;
  end loop;

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

-- Default opening hours for seeded locations (Mon–Sat 10–22, Sun closed for Little Asia)
update public.locations set opening_hours =
  '{"1":{"open":"10:00","close":"22:00"},"2":{"open":"10:00","close":"22:00"},"3":{"open":"10:00","close":"22:00"},"4":{"open":"10:00","close":"22:00"},"5":{"open":"10:00","close":"23:00"},"6":{"open":"11:00","close":"23:00"},"7":null}'::jsonb
  where name = 'Little Asia' and opening_hours = '{}'::jsonb;
update public.locations set opening_hours =
  '{"1":{"open":"09:00","close":"21:00"},"2":{"open":"09:00","close":"21:00"},"3":{"open":"09:00","close":"21:00"},"4":{"open":"09:00","close":"21:00"},"5":{"open":"09:00","close":"22:00"},"6":{"open":"10:00","close":"22:00"},"7":{"open":"11:00","close":"20:00"}}'::jsonb
  where opening_hours = '{}'::jsonb;

-- Example: Kitchen Staff role carries the kitchen responsibilities
insert into public.job_role_responsibilities (job_role_id, responsibility_id) values
  ('e0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000004'),
  ('e0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000003')
on conflict do nothing;

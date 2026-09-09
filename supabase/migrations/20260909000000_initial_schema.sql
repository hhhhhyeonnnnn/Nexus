-- Initial draft: tenant-scoped reads only. No application write policies yet.
-- Apply to a local Supabase instance and review before any hosted deployment.
begin;

create type public.organization_role as enum ('PRESIDENT', 'VICE_PRESIDENT', 'ADMIN', 'MEMBER');
create type public.project_status as enum ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  university_name text not null check (length(trim(university_name)) > 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  email text not null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references public.profiles(id),
  role public.organization_role not null default 'MEMBER',
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  status public.project_status not null default 'PLANNED',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  assignee_id uuid,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  status public.task_status not null default 'TODO',
  due_date date,
  created_at timestamptz not null default now(),
  foreign key (organization_id, project_id) references public.projects(organization_id, id),
  foreign key (organization_id, assignee_id) references public.organization_members(organization_id, user_id)
);
create index tasks_org_due_idx on public.tasks(organization_id, due_date);
create index tasks_project_idx on public.tasks(organization_id, project_id);
create index tasks_assignee_idx on public.tasks(organization_id, assignee_id);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  title text not null check (length(trim(title)) > 0),
  content text not null default '',
  meeting_date timestamptz not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, project_id) references public.projects(organization_id, id)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  meeting_id uuid,
  title text not null check (length(trim(title)) > 0),
  content text not null check (length(trim(content)) > 0),
  reason text,
  decided_at timestamptz not null default now(),
  foreign key (organization_id, project_id) references public.projects(organization_id, id),
  foreign key (organization_id, meeting_id) references public.meetings(organization_id, id)
);
create index decisions_meeting_idx on public.decisions(organization_id, meeting_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  title text not null check (length(trim(title)) > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  foreign key (organization_id, project_id) references public.projects(organization_id, id),
  check (end_at >= start_at)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) > 0),
  category text,
  phone text,
  contact_name text,
  rating smallint check (rating between 1 and 5),
  memo text not null default '',
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  vendor_id uuid,
  title text not null check (length(trim(title)) > 0),
  category text,
  planned_amount numeric(14, 0) not null default 0 check (planned_amount >= 0),
  actual_amount numeric(14, 0) not null default 0 check (actual_amount >= 0),
  created_at timestamptz not null default now(),
  foreign key (organization_id, project_id) references public.projects(organization_id, id),
  foreign key (organization_id, vendor_id) references public.vendors(organization_id, id)
);
create index budgets_vendor_idx on public.budgets(organization_id, vendor_id);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  title text not null check (length(trim(title)) > 0),
  external_url text not null check (external_url ~ '^https://[^[:space:]]+$'),
  source text not null default 'EXTERNAL' check (source in ('EXTERNAL', 'GOOGLE_DRIVE')),
  created_at timestamptz not null default now(),
  foreign key (organization_id, project_id) references public.projects(organization_id, id)
);

-- Security-definer membership lookup avoids recursive membership-table RLS.
-- Keep this schema outside the Supabase Data API's exposed schemas.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_organization_member(uuid) from public, anon;
grant execute on function private.is_organization_member(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
revoke all on public.organizations, public.profiles from anon, authenticated;
grant select on public.organizations, public.profiles to authenticated;
create policy organizations_member_read on public.organizations
  for select to authenticated using (private.is_organization_member(id));
-- Email is private in this draft. A minimal roster API can be added with Auth.
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = (select auth.uid()));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'organization_members', 'projects', 'tasks', 'meetings', 'decisions',
    'events', 'budgets', 'vendors', 'files'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format(
      'create policy member_read on public.%I for select to authenticated using (private.is_organization_member(organization_id))',
      table_name
    );
  end loop;
  foreach table_name in array array['meetings', 'decisions', 'events', 'budgets', 'files'] loop
    execute format('create index %I on public.%I(organization_id, project_id)', table_name || '_project_idx', table_name);
  end loop;
end;
$$;

commit;

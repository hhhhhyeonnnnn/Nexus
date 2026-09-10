-- Migration: 20260910200000_departments_and_org_chart.sql
-- 1. Create departments table for student council bureaus/departments
-- 2. Add department_id and job_title to organization_members
-- 3. Add department_id to tasks and budgets with tenant-safe composite foreign keys
-- 4. Add RLS policies for departments
begin;

set search_path = '';

-- 1. Create departments table
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  color text not null default 'blue',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, name)
);

create index departments_org_sort_idx on public.departments(organization_id, sort_order, name);

-- 2. Add columns to organization_members
alter table public.organization_members
  add column if not exists department_id uuid,
  add column if not exists job_title text;

alter table public.organization_members
  add constraint organization_members_department_fkey
  foreign key (organization_id, department_id)
  references public.departments(organization_id, id)
  on delete set null;

create index org_members_dept_idx on public.organization_members(organization_id, department_id);

-- 3. Add department_id to tasks
alter table public.tasks
  add column if not exists department_id uuid;

alter table public.tasks
  add constraint tasks_department_fkey
  foreign key (organization_id, department_id)
  references public.departments(organization_id, id)
  on delete set null;

create index tasks_dept_idx on public.tasks(organization_id, department_id);

-- 4. Add department_id to budgets
alter table public.budgets
  add column if not exists department_id uuid;

alter table public.budgets
  add constraint budgets_department_fkey
  foreign key (organization_id, department_id)
  references public.departments(organization_id, id)
  on delete set null;

create index budgets_dept_idx on public.budgets(organization_id, department_id);

-- 5. Enable RLS and grant permissions on departments
alter table public.departments enable row level security;

grant select, insert, update, delete on public.departments to authenticated;

create policy departments_member_read on public.departments
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy departments_admin_insert on public.departments
  for insert to authenticated
  with check (private.is_organization_admin(organization_id));

create policy departments_admin_update on public.departments
  for update to authenticated
  using (private.is_organization_admin(organization_id))
  with check (private.is_organization_admin(organization_id));

create policy departments_admin_delete on public.departments
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

-- 6. Update organization_members update policy so org admins can manage department and job title
drop policy if exists org_members_update on public.organization_members;
create policy org_members_update on public.organization_members
  for update to authenticated
  using (private.is_organization_admin(organization_id))
  with check (private.is_organization_admin(organization_id));

commit;

-- Migration: 20260910300000_event_forms_and_tickets.sql
-- 1. Create event_forms table for event/booth application forms
-- 2. Create form_submissions table for participant submissions and tickets
-- 3. Enable RLS and define member & public (anon) access policies
begin;

set search_path = '';

-- 1. Create event_forms table
create table public.event_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  category text not null default 'BOOTH' check (category in ('BOOTH', 'TICKET', 'GENERAL')),
  status text not null default 'OPEN' check (status in ('DRAFT', 'OPEN', 'CLOSED')),
  start_at timestamptz,
  end_at timestamptz,
  max_capacity integer check (max_capacity is null or max_capacity > 0),
  custom_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, project_id) references public.projects(organization_id, id) on delete set null,
  unique (organization_id, id),
  check (end_at is null or start_at is null or end_at >= start_at)
);

create index if not exists event_forms_org_status_idx on public.event_forms(organization_id, status);
create index if not exists event_forms_org_created_idx on public.event_forms(organization_id, created_at);

-- 2. Create form_submissions table
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  form_id uuid not null,
  applicant_name text not null check (length(trim(applicant_name)) > 0),
  applicant_email text,
  applicant_phone text not null check (length(trim(applicant_phone)) > 0),
  applicant_student_id text,
  applicant_department text,
  group_name text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  ticket_code text not null unique check (length(trim(ticket_code)) > 0),
  responses jsonb not null default '{}'::jsonb,
  rejection_reason text,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, form_id) references public.event_forms(organization_id, id) on delete cascade,
  unique (organization_id, id)
);

create index if not exists form_submissions_form_idx on public.form_submissions(organization_id, form_id);
create index if not exists form_submissions_status_idx on public.form_submissions(form_id, status);
create index if not exists form_submissions_ticket_idx on public.form_submissions(ticket_code);

-- 3. Enable RLS
alter table public.event_forms enable row level security;
alter table public.form_submissions enable row level security;

-- 4. Grant table access permissions
grant select, insert, update, delete on public.event_forms to authenticated;
grant select on public.event_forms to anon;

grant select, insert, update, delete on public.form_submissions to authenticated;
grant select, insert on public.form_submissions to anon;

-- 5. event_forms RLS policies
create policy event_forms_member_select on public.event_forms
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy event_forms_anon_select on public.event_forms
  for select to anon
  using (status = 'OPEN');

create policy event_forms_member_insert on public.event_forms
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy event_forms_member_update on public.event_forms
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy event_forms_admin_delete on public.event_forms
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

-- 6. form_submissions RLS policies
create policy form_submissions_member_select on public.form_submissions
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy form_submissions_anon_select on public.form_submissions
  for select to anon
  using (ticket_code is not null);

create policy form_submissions_member_insert on public.form_submissions
  for insert to authenticated
  with check (
    private.is_organization_member(organization_id)
    or exists (
      select 1 from public.event_forms f
      where f.id = form_id and f.organization_id = form_submissions.organization_id and f.status = 'OPEN'
    )
  );

create policy form_submissions_anon_insert on public.form_submissions
  for insert to anon
  with check (
    exists (
      select 1 from public.event_forms f
      where f.id = form_id and f.organization_id = form_submissions.organization_id and f.status = 'OPEN'
    )
  );

create policy form_submissions_member_update on public.form_submissions
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy form_submissions_admin_delete on public.form_submissions
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

commit;

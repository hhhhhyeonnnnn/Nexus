-- Migration: 20260910000000_meetings_and_decisions.sql
-- 1. Extend meetings table with attendees
-- 2. Add write policies for meetings and decisions tables
begin;

set search_path = '';

-- 1. Extend meetings schema
alter table public.meetings
  add column if not exists attendees text;

create index if not exists meetings_date_idx on public.meetings(organization_id, meeting_date desc);

-- 2. Grant insert, update, delete permissions to authenticated role
grant insert, update, delete on public.meetings to authenticated;
grant insert, update, delete on public.decisions to authenticated;

-- 3. Meetings RLS write policies
create policy meetings_member_insert on public.meetings
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy meetings_member_update on public.meetings
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy meetings_admin_delete on public.meetings
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

-- 4. Decisions RLS write policies
create policy decisions_member_insert on public.decisions
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy decisions_member_update on public.decisions
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy decisions_admin_delete on public.decisions
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

commit;

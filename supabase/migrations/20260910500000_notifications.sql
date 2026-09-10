-- Migration: 20260910500000_notifications.sql
-- 1. Create notifications table for in-app student council activity alerts
-- 2. Enable RLS and define member & recipient access policies
begin;

set search_path = '';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  message text not null,
  type text not null default 'INFO' check (type in ('TASK_ASSIGNED', 'APPROVAL_REQUEST', 'APPROVAL_RESULT', 'PETITION_NEW', 'FORM_SUBMISSION', 'INFO')),
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists notifications_user_idx on public.notifications(user_id, is_read, created_at desc);
create index if not exists notifications_org_idx on public.notifications(organization_id, created_at desc);

alter table public.notifications enable row level security;

grant select, insert, update, delete on public.notifications to authenticated;

-- RLS: user can view their own notifications in their organization
create policy notifications_user_select on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()) and private.is_organization_member(organization_id));

-- RLS: organization members can insert notifications for users in the same organization
create policy notifications_member_insert on public.notifications
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

-- RLS: user can mark their own notifications as read
create policy notifications_user_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()) and private.is_organization_member(organization_id))
  with check (user_id = (select auth.uid()) and private.is_organization_member(organization_id));

-- RLS: user can delete their own notifications
create policy notifications_user_delete on public.notifications
  for delete to authenticated
  using (user_id = (select auth.uid()) and private.is_organization_member(organization_id));

commit;

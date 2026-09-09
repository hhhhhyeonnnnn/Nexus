-- Organization onboarding: creation requests (site admin review),
-- join requests (org admin review), and authorized member write policies.
begin;

set search_path = '';

-- 1. Helper functions for role-based security checks
create function private.is_site_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_site_admin = true
  );
$$;
revoke all on function private.is_site_admin() from public, anon;
grant execute on function private.is_site_admin() to authenticated;

create function private.is_organization_admin(target_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and role in ('PRESIDENT', 'VICE_PRESIDENT', 'ADMIN')
  );
$$;
revoke all on function private.is_organization_admin(uuid) from public, anon;
grant execute on function private.is_organization_admin(uuid) to authenticated;

-- 2. Organization creation requests table
create table public.organization_creation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  org_name text not null check (length(trim(org_name)) > 0),
  university_name text not null check (length(trim(university_name)) > 0),
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index org_creation_req_requester_idx on public.organization_creation_requests(requester_id);
create index org_creation_req_status_idx on public.organization_creation_requests(status);

alter table public.organization_creation_requests enable row level security;
revoke all on public.organization_creation_requests from anon, authenticated;
grant select, insert, update on public.organization_creation_requests to authenticated;

create policy org_creation_req_read on public.organization_creation_requests
  for select to authenticated using (
    requester_id = (select auth.uid()) or private.is_site_admin()
  );

create policy org_creation_req_insert on public.organization_creation_requests
  for insert to authenticated with check (
    requester_id = (select auth.uid()) and status = 'pending'
  );

create policy org_creation_req_update on public.organization_creation_requests
  for update to authenticated using (
    private.is_site_admin()
  ) with check (
    private.is_site_admin()
  );

-- 3. Organization join requests table
create table public.organization_join_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index org_join_req_org_idx on public.organization_join_requests(organization_id);
create index org_join_req_requester_idx on public.organization_join_requests(requester_id);

alter table public.organization_join_requests enable row level security;
revoke all on public.organization_join_requests from anon, authenticated;
grant select, insert, update on public.organization_join_requests to authenticated;

create policy org_join_req_read on public.organization_join_requests
  for select to authenticated using (
    requester_id = (select auth.uid()) or private.is_organization_admin(organization_id)
  );

create policy org_join_req_insert on public.organization_join_requests
  for insert to authenticated with check (
    requester_id = (select auth.uid()) and status = 'pending'
  );

create policy org_join_req_update on public.organization_join_requests
  for update to authenticated using (
    private.is_organization_admin(organization_id)
  ) with check (
    private.is_organization_admin(organization_id)
  );

-- 4. Organizations: allow authenticated users to view all orgs (to search & request join),
-- and allow site admin to insert approved organizations.
create policy organizations_authenticated_browse on public.organizations
  for select to authenticated using (true);

grant insert on public.organizations to authenticated;
create policy organizations_site_admin_insert on public.organizations
  for insert to authenticated with check (
    private.is_site_admin()
  );

-- 5. Organization members write policies:
-- - Insert: site admin (creating org president) or org admin (approving member)
-- - Update: org admin, but cannot self-promote or modify own membership
-- - Delete: self-leave or org admin removing member
grant insert, update, delete on public.organization_members to authenticated;

create policy org_members_insert on public.organization_members
  for insert to authenticated with check (
    private.is_site_admin() or private.is_organization_admin(organization_id)
  );

create policy org_members_update on public.organization_members
  for update to authenticated using (
    private.is_organization_admin(organization_id) and user_id <> (select auth.uid())
  ) with check (
    private.is_organization_admin(organization_id) and user_id <> (select auth.uid())
  );

create policy org_members_delete on public.organization_members
  for delete to authenticated using (
    user_id = (select auth.uid()) or private.is_organization_admin(organization_id)
  );

commit;

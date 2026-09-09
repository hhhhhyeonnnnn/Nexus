-- Profiles shared read policies:
-- 1. Allow members of the same organization to view each other's profiles (name, email).
-- 2. Allow organization administrators to view applicants' profiles for pending join requests.
-- 3. Allow site administrators to view all profiles (for platform operations and org creation reviews).
begin;

set search_path = '';

-- Helper 1: Check if auth.uid() and target_user_id share at least one organization
create function private.shares_organization_with(target_user_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om_self
    join public.organization_members om_target
      on om_self.organization_id = om_target.organization_id
    where om_self.user_id = (select auth.uid())
      and om_target.user_id = target_user_id
  );
$$;
revoke all on function private.shares_organization_with(uuid) from public, anon;
grant execute on function private.shares_organization_with(uuid) to authenticated;

-- Helper 2: Check if target_user_id has a pending join request to an org where auth.uid() is an admin
create function private.is_requester_for_admin_org(target_user_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_join_requests ojr
    join public.organization_members om
      on ojr.organization_id = om.organization_id
    where ojr.requester_id = target_user_id
      and om.user_id = (select auth.uid())
      and om.role in ('PRESIDENT', 'VICE_PRESIDENT', 'ADMIN')
  );
$$;
revoke all on function private.is_requester_for_admin_org(uuid) from public, anon;
grant execute on function private.is_requester_for_admin_org(uuid) to authenticated;

-- Policy 1: Organization co-members can view each other's profiles
create policy profiles_org_shared_read on public.profiles
  for select to authenticated using (
    private.shares_organization_with(id)
  );

-- Policy 2: Organization admins can view profiles of applicants
create policy profiles_join_request_read on public.profiles
  for select to authenticated using (
    private.is_requester_for_admin_org(id)
  );

-- Policy 3: Site admins can view all profiles
create policy profiles_site_admin_read on public.profiles
  for select to authenticated using (
    private.is_site_admin()
  );

commit;

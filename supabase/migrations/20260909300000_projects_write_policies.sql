-- Projects write policies (INSERT, UPDATE, DELETE)
-- Read policy (projects_member_read) was already defined in initial schema.
begin;

set search_path = '';

-- 1. Extend table grants for authenticated users
grant insert, update, delete on public.projects to authenticated;

-- 2. INSERT: any member of the organization can create a project
create policy projects_member_insert on public.projects
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

-- 3. UPDATE: any member of the organization can update projects in their organization
create policy projects_member_update on public.projects
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

-- 4. DELETE: only organization admins (PRESIDENT, VICE_PRESIDENT, ADMIN) can delete projects
create policy projects_admin_delete on public.projects
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

commit;

-- Tasks write policies (INSERT, UPDATE, DELETE)
-- Read policy (tasks_member_read) was already defined in initial schema.
begin;

set search_path = '';

-- 1. Extend table grants for authenticated users
grant insert, update, delete on public.tasks to authenticated;

-- 2. INSERT: any member of the organization can create a task
create policy tasks_member_insert on public.tasks
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

-- 3. UPDATE: any member of the organization can update tasks in their organization
create policy tasks_member_update on public.tasks
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

-- 4. DELETE: organization admin or task assignee can delete tasks
create policy tasks_member_delete on public.tasks
  for delete to authenticated
  using (
    private.is_organization_admin(organization_id)
    or assignee_id = (select auth.uid())
  );

commit;

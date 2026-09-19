-- User-authorized cleanup, scoped to the verified test organization UUID.
-- Does not delete profiles, Auth accounts, or any other organization.
begin;
do $$
declare
  target uuid := 'a57aaf3e-8bd6-4487-b027-6129c38fec40';
  target_name text;
  child_table text;
begin
  select name into target_name from public.organizations where id = target for update;
  if not found then return; end if;
  if target_name <> '드럼' then
    raise exception 'Cleanup target name differs; refusing to delete';
  end if;
  -- Delete referencing rows before their parents; retain tenant-safe constraints.
  foreach child_table in array array[
    'notifications', 'approval_logs', 'approvals', 'poll_votes', 'polls',
    'petitions', 'announcements', 'form_submissions', 'event_forms',
    'files', 'budgets', 'decisions', 'tasks', 'events', 'meetings',
    'vendors', 'projects', 'organization_join_requests',
    'organization_members', 'departments'
  ] loop
    execute format('delete from public.%I where organization_id = $1', child_table) using target;
  end loop;
  delete from public.organization_creation_requests
    where id = '06490a77-b13d-44ad-81de-33f5f6c032e1' and org_name = target_name;
  delete from public.organizations where id = target;
end $$;
commit;

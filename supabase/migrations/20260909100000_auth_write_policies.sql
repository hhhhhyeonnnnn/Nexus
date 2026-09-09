-- Add is_site_admin column and self-write policies for profiles.
-- Existing profiles_self_read policy and SELECT grants are left untouched.
begin;

set search_path = '';

-- 1. New column: site-admin flag, conservative default.
alter table public.profiles
  add column is_site_admin boolean not null default false;

-- 2. Extend grants so authenticated users can write their own row.
grant insert, update on public.profiles to authenticated;

-- 3. INSERT: a user may only create their own profile row.
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- 4. UPDATE: a user may only modify their own profile row.
--    is_site_admin is intentionally not excluded here; promotion is
--    enforced at the application layer (admin-only server actions).
create policy profiles_self_update on public.profiles
  for update to authenticated
  using     (id = (select auth.uid()))
  with check (id = (select auth.uid()));

commit;

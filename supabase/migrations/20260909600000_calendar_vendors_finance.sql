-- Migration: 20260909600000_calendar_vendors_finance.sql
-- 1. Extend budgets table with transaction_date, type (INCOME/EXPENSE), and receipt_url
-- 2. Add write policies for events, vendors, and budgets tables
begin;

set search_path = '';

-- 1. Extend budgets schema
alter table public.budgets
  add column if not exists transaction_date date not null default current_date,
  add column if not exists type text not null default 'EXPENSE' check (type in ('INCOME', 'EXPENSE')),
  add column if not exists receipt_url text;

create index if not exists budgets_date_idx on public.budgets(organization_id, transaction_date);
create index if not exists budgets_type_idx on public.budgets(organization_id, type);

-- 2. Grant insert, update, delete permissions to authenticated role
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.vendors to authenticated;
grant insert, update, delete on public.budgets to authenticated;

-- 3. Events RLS write policies
create policy events_member_insert on public.events
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy events_member_update on public.events
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy events_member_delete on public.events
  for delete to authenticated
  using (private.is_organization_member(organization_id));

-- 4. Vendors RLS write policies
create policy vendors_member_insert on public.vendors
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy vendors_member_update on public.vendors
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy vendors_admin_delete on public.vendors
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

-- 5. Budgets RLS write policies
create policy budgets_member_insert on public.budgets
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy budgets_member_update on public.budgets
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy budgets_admin_delete on public.budgets
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

commit;

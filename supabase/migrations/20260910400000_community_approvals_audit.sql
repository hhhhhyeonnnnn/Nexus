-- Migration: 20260910400000_community_approvals_audit.sql
-- 1. Create announcements, petitions, polls, poll_votes tables (Community & Feed)
-- 2. Create approvals, approval_logs tables (Multi-step Approval Workflow)
-- 3. Enable RLS and define member & public policies
begin;

set search_path = '';

-- ==========================================
-- 1. Announcements (공지사항)
-- ==========================================
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  content text not null,
  category text not null default 'GENERAL' check (category in ('GENERAL', 'ACADEMIC', 'EVENT', 'FINANCE')),
  is_pinned boolean not null default false,
  is_public boolean not null default true,
  author_id uuid references public.profiles(id) on delete set null,
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists announcements_org_pinned_idx on public.announcements(organization_id, is_pinned desc, created_at desc);
create index if not exists announcements_org_category_idx on public.announcements(organization_id, category);

-- ==========================================
-- 2. Petitions (학생 건의함)
-- ==========================================
create table public.petitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  content text not null check (length(trim(content)) > 0),
  author_name text not null default '익명',
  student_id text,
  is_secret boolean not null default false,
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_REVIEW', 'ANSWERED', 'REJECTED')),
  official_answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists petitions_org_status_idx on public.petitions(organization_id, status);
create index if not exists petitions_org_created_idx on public.petitions(organization_id, created_at desc);

-- ==========================================
-- 3. Polls & Poll Votes (캠퍼스 투표)
-- ==========================================
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  options jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  is_closed boolean not null default false,
  total_votes integer not null default 0 check (total_votes >= 0),
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists polls_org_closed_idx on public.polls(organization_id, is_closed, created_at desc);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  poll_id uuid not null,
  voter_identifier text not null check (length(trim(voter_identifier)) > 0),
  selected_option_id text not null check (length(trim(selected_option_id)) > 0),
  created_at timestamptz not null default now(),
  foreign key (organization_id, poll_id) references public.polls(organization_id, id) on delete cascade,
  unique (poll_id, voter_identifier),
  unique (organization_id, id)
);

create index if not exists poll_votes_poll_idx on public.poll_votes(poll_id);

-- ==========================================
-- 4. Approvals & Approval Logs (다단계 전자결재)
-- ==========================================
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  type text not null default 'GENERAL' check (type in ('EXPENSE', 'EVENT', 'GENERAL')),
  amount numeric check (amount is null or amount >= 0),
  content text not null default '',
  applicant_id uuid not null references public.profiles(id),
  department_id uuid,
  project_id uuid,
  status text not null default 'PENDING' check (status in ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED')),
  current_step integer not null default 1,
  total_steps integer not null default 2,
  steps jsonb not null default '[]'::jsonb,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, department_id) references public.departments(organization_id, id) on delete set null,
  foreign key (organization_id, project_id) references public.projects(organization_id, id) on delete set null,
  unique (organization_id, id)
);

create index if not exists approvals_org_status_idx on public.approvals(organization_id, status);
create index if not exists approvals_applicant_idx on public.approvals(applicant_id);

create table public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  approval_id uuid not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default '관리자',
  action text not null check (action in ('SUBMIT', 'APPROVE_STEP', 'FINAL_APPROVE', 'REJECT', 'COMMENT')),
  comment text,
  created_at timestamptz not null default now(),
  foreign key (organization_id, approval_id) references public.approvals(organization_id, id) on delete cascade,
  unique (organization_id, id)
);

create index if not exists approval_logs_approval_idx on public.approval_logs(approval_id, created_at);

-- ==========================================
-- 5. Enable RLS
-- ==========================================
alter table public.announcements enable row level security;
alter table public.petitions enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.approvals enable row level security;
alter table public.approval_logs enable row level security;

-- ==========================================
-- 6. Grant Permissions
-- ==========================================
grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.announcements to anon;

grant select, insert, update, delete on public.petitions to authenticated;
grant select, insert on public.petitions to anon;

grant select, insert, update, delete on public.polls to authenticated;
grant select on public.polls to anon;

grant select, insert, delete on public.poll_votes to authenticated;
grant select, insert on public.poll_votes to anon;

grant select, insert, update, delete on public.approvals to authenticated;
grant select, insert on public.approval_logs to authenticated;

-- ==========================================
-- 7. Announcements Policies
-- ==========================================
create policy announcements_member_select on public.announcements
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy announcements_anon_select on public.announcements
  for select to anon
  using (is_public = true);

create policy announcements_member_insert on public.announcements
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy announcements_member_update on public.announcements
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy announcements_admin_delete on public.announcements
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

-- ==========================================
-- 8. Petitions Policies
-- ==========================================
create policy petitions_member_select on public.petitions
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy petitions_anon_select on public.petitions
  for select to anon
  using (is_secret = false);

create policy petitions_member_insert on public.petitions
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy petitions_anon_insert on public.petitions
  for insert to anon
  with check (true);

create policy petitions_member_update on public.petitions
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy petitions_admin_delete on public.petitions
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

-- ==========================================
-- 9. Polls & Votes Policies
-- ==========================================
create policy polls_member_select on public.polls
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy polls_anon_select on public.polls
  for select to anon
  using (true);

create policy polls_member_insert on public.polls
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy polls_member_update on public.polls
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy polls_admin_delete on public.polls
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

create policy poll_votes_member_select on public.poll_votes
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy poll_votes_anon_select on public.poll_votes
  for select to anon
  using (true);

create policy poll_votes_member_insert on public.poll_votes
  for insert to authenticated
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.organization_id = poll_votes.organization_id and p.is_closed = false
    )
  );

create policy poll_votes_anon_insert on public.poll_votes
  for insert to anon
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.organization_id = poll_votes.organization_id and p.is_closed = false
    )
  );

-- ==========================================
-- 10. Approvals & Logs Policies
-- ==========================================
create policy approvals_member_select on public.approvals
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy approvals_member_insert on public.approvals
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

create policy approvals_member_update on public.approvals
  for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (private.is_organization_member(organization_id));

create policy approvals_admin_delete on public.approvals
  for delete to authenticated
  using (private.is_organization_admin(organization_id));

create policy approval_logs_member_select on public.approval_logs
  for select to authenticated
  using (private.is_organization_member(organization_id));

create policy approval_logs_member_insert on public.approval_logs
  for insert to authenticated
  with check (private.is_organization_member(organization_id));

commit;

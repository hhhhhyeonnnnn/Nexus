-- Migration: 20260911150000_supabase_realtime_setup.sql
-- Enable Supabase Realtime publication for student council collaboration tables:
-- 1. notifications (instant push & floating toast)
-- 2. organization_join_requests & organization_creation_requests (live onboarding approval transition)
-- 3. organization_members (membership role / status transitions)
-- 4. form_submissions & event_forms (live ticket check-in desk & capacity counters)
-- 5. polls & poll_votes & petitions (live campus voting graphs & petition counters)
-- 6. approvals & approval_logs (live approval decision stamps & status transitions)
-- 7. tasks (live workload & task status sync)
begin;

set search_path = '';

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.organization_join_requests;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.organization_creation_requests;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.organization_members;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.form_submissions;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.event_forms;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.polls;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.poll_votes;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.petitions;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.approvals;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.approval_logs;
    exception when others then null;
    end;

    begin
      alter publication supabase_realtime add table public.tasks;
    exception when others then null;
    end;
  end if;
end $$;

commit;

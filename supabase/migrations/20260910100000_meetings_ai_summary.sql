-- Migration: 20260910100000_meetings_ai_summary.sql
-- 1. Extend meetings table with ai_summary for storing confirmed AI agenda summaries
begin;

set search_path = '';

alter table public.meetings
  add column if not exists ai_summary text;

commit;

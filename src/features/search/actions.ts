"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";

export type SearchCategory =
  | "project"
  | "task"
  | "meeting"
  | "decision"
  | "approval"
  | "announcement"
  | "form"
  | "page";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  categoryLabel: string;
  url: string;
}

export async function searchWorkspace(query: string): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!getSupabaseConfig()) return [];
  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  const orgId = membership.organizationId;
  const pattern = `%${trimmed}%`;

  const [
    projectsRes,
    tasksRes,
    meetingsRes,
    decisionsRes,
    approvalsRes,
    announcementsRes,
    formsRes,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, description")
      .eq("organization_id", orgId)
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, status, project_id")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(8),
    supabase
      .from("meetings")
      .select("id, title, meeting_date")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("decisions")
      .select("id, title, meeting_id, content")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("approvals")
      .select("id, title, type, status")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("announcements")
      .select("id, title, created_at")
      .eq("organization_id", orgId)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("event_forms")
      .select("id, title, category, status")
      .eq("organization_id", orgId)
      .ilike("title", pattern)
      .limit(5),
  ]);

  const results: SearchResultItem[] = [];

  for (const p of projectsRes.data ?? []) {
    results.push({
      id: `proj-${p.id}`,
      title: p.name,
      subtitle: p.description ?? `상태: ${p.status}`,
      category: "project",
      categoryLabel: "프로젝트",
      url: `/projects/${p.id}`,
    });
  }

  for (const t of tasksRes.data ?? []) {
    results.push({
      id: `task-${t.id}`,
      title: t.title,
      subtitle: `상태: ${t.status}`,
      category: "task",
      categoryLabel: "업무",
      url: t.project_id ? `/projects/${t.project_id}` : "/tasks",
    });
  }

  for (const m of meetingsRes.data ?? []) {
    results.push({
      id: `meet-${m.id}`,
      title: m.title,
      subtitle: `일시: ${new Date(m.meeting_date).toLocaleDateString("ko-KR")}`,
      category: "meeting",
      categoryLabel: "회의록",
      url: `/meetings/${m.id}`,
    });
  }

  for (const d of decisionsRes.data ?? []) {
    results.push({
      id: `dec-${d.id}`,
      title: d.title,
      subtitle: d.content.slice(0, 60),
      category: "decision",
      categoryLabel: "결정사항",
      url: d.meeting_id ? `/meetings/${d.meeting_id}` : "/meetings",
    });
  }

  for (const a of approvalsRes.data ?? []) {
    results.push({
      id: `app-${a.id}`,
      title: a.title,
      subtitle: `유형: ${a.type} · 상태: ${a.status}`,
      category: "approval",
      categoryLabel: "전자결재",
      url: "/approvals",
    });
  }

  for (const an of announcementsRes.data ?? []) {
    results.push({
      id: `anno-${an.id}`,
      title: an.title,
      subtitle: new Date(an.created_at).toLocaleDateString("ko-KR"),
      category: "announcement",
      categoryLabel: "공지사항",
      url: "/community",
    });
  }

  for (const f of formsRes.data ?? []) {
    results.push({
      id: `form-${f.id}`,
      title: f.title,
      subtitle: `구분: ${f.category} · 상태: ${f.status}`,
      category: "form",
      categoryLabel: "행사·티켓",
      url: "/forms",
    });
  }

  return results;
}

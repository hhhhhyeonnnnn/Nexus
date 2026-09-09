"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type EventRow = Database["public"]["Tables"]["events"]["Row"] & {
  projects?: { id: string; name: string } | null;
};

export interface CalendarTaskItem {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  projectName?: string | null;
}

export interface CalendarProjectItem {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface CalendarMonthData {
  year: number;
  month: number; // 1-indexed (1 ~ 12)
  events: EventRow[];
  tasks: CalendarTaskItem[];
  projects: CalendarProjectItem[];
  availableProjects: Array<{ id: string; name: string }>;
}

export async function getCalendarData(
  yearArg?: number,
  monthArg?: number,
): Promise<CalendarMonthData> {
  const now = new Date();
  const year = yearArg ?? now.getFullYear();
  const month = monthArg ?? now.getMonth() + 1;

  if (!getSupabaseConfig()) {
    return { year, month, events: [], tasks: [], projects: [], availableProjects: [] };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { year, month, events: [], tasks: [], projects: [], availableProjects: [] };
  }

  const supabase = await createClient();

  // Range: Start of month to End of month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  const startDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateStr = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  // 1. Events in this month
  const { data: eventsData } = await supabase
    .from("events")
    .select("*, projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .gte("end_at", startIso)
    .lte("start_at", endIso)
    .order("start_at", { ascending: true });

  // 2. Tasks with due_date in this month
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, title, status, due_date, projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .gte("due_date", startDateStr)
    .lte("due_date", endDateStr)
    .order("due_date", { ascending: true });

  // 3. Projects active in this month
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name, status, start_date, end_date")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  const activeProjects: CalendarProjectItem[] = (projectsData ?? []).filter((p) => {
    if (!p.start_date && !p.end_date) return false;
    const start = p.start_date ?? "1970-01-01";
    const end = p.end_date ?? "2099-12-31";
    return start <= endDateStr && end >= startDateStr;
  }).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    startDate: p.start_date,
    endDate: p.end_date,
  }));

  const tasks: CalendarTaskItem[] = (tasksData ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    dueDate: t.due_date ?? "",
    projectName: t.projects?.name,
  }));

  const availableProjects = (projectsData ?? []).map((p) => ({ id: p.id, name: p.name }));

  return {
    year,
    month,
    events: (eventsData ?? []) as EventRow[],
    tasks,
    projects: activeProjects,
    availableProjects,
  };
}

export async function createEvent(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const title = formData.get("title");
  const startAt = formData.get("start_at");
  const endAt = formData.get("end_at");
  const projectId = formData.get("project_id") as string | null;

  if (typeof title !== "string" || !title.trim()) {
    return { error: "일정 제목을 입력해 주세요." };
  }
  if (typeof startAt !== "string" || !startAt) {
    return { error: "시작 일시를 입력해 주세요." };
  }
  if (typeof endAt !== "string" || !endAt) {
    return { error: "종료 일시를 입력해 주세요." };
  }
  if (new Date(endAt) < new Date(startAt)) {
    return { error: "종료 일시는 시작 일시 이후여야 합니다." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    organization_id: membership.organizationId,
    project_id: projectId || null,
    title: title.trim(),
    start_at: new Date(startAt).toISOString(),
    end_at: new Date(endAt).toISOString(),
  });

  if (error) {
    return { error: "일정 등록에 실패했습니다: " + error.message };
  }

  revalidatePath("/calendar");
  return { error: null, success: true };
}

export async function deleteEvent(
  eventId: string,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", eventId);

  if (error) {
    return { error: "일정 삭제에 실패했습니다: " + error.message };
  }

  revalidatePath("/calendar");
  return { error: null, success: true };
}

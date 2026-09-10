"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

import {
  analyzeMeetingWithAI,
  type MeetingTaskCandidate,
  type MeetingDecisionCandidate,
} from "@/lib/ai/analyze-meeting";
import {
  clarifyTranscriptWithAI,
  type TranscriptClarificationResult,
} from "@/lib/ai/clarify-transcript";

export type MeetingRow = Database["public"]["Tables"]["meetings"]["Row"];
export type DecisionRow = Database["public"]["Tables"]["decisions"]["Row"];

export interface MeetingWithStats extends MeetingRow {
  projectName?: string | null;
  decisionCount: number;
}

export interface MeetingsPageData {
  meetings: MeetingWithStats[];
  projects: Array<{ id: string; name: string }>;
  isAdmin: boolean;
}

export interface MeetingDetailData {
  meeting: MeetingWithStats | null;
  decisions: DecisionRow[];
  projects: Array<{ id: string; name: string }>;
  members: Array<{ userId: string; name: string; email: string }>;
  isAdmin: boolean;
}

export interface DashboardMeetingSummary {
  id: string;
  title: string;
  meetingDate: string;
  projectName: string | null;
}

export interface DashboardDecisionSummary {
  id: string;
  title: string;
  content: string;
  decidedAt: string | null;
  meetingId: string | null;
}

export async function getDashboardMeetingSummaries(): Promise<{
  thisWeekMeetings: DashboardMeetingSummary[];
  recentDecisions: DashboardDecisionSummary[];
}> {
  const empty = { thisWeekMeetings: [], recentDecisions: [] };

  if (!getSupabaseConfig()) return empty;

  const membership = await getCurrentUserOrganization();
  if (!membership) return empty;

  const supabase = await createClient();
  const orgId = membership.organizationId;

  // This week: Monday 00:00 ~ Sunday 23:59 (KST → use ISO dates)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon …
  const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const [meetingsRes, decisionsRes] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, meeting_date, projects(name)")
      .eq("organization_id", orgId)
      .gte("meeting_date", monday.toISOString().slice(0, 10))
      .lte("meeting_date", sunday.toISOString().slice(0, 10))
      .order("meeting_date", { ascending: true })
      .limit(5),
    supabase
      .from("decisions")
      .select("id, title, content, decided_at, meeting_id")
      .eq("organization_id", orgId)
      .order("decided_at", { ascending: false })
      .limit(5),
  ]);

  const thisWeekMeetings: DashboardMeetingSummary[] = (meetingsRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    meetingDate: m.meeting_date,
    projectName: (m.projects as { name: string } | null)?.name ?? null,
  }));

  const recentDecisions: DashboardDecisionSummary[] = (decisionsRes.data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    decidedAt: d.decided_at,
    meetingId: d.meeting_id,
  }));

  return { thisWeekMeetings, recentDecisions };
}

export async function getMeetings(projectId?: string): Promise<MeetingsPageData> {
  const emptyResult: MeetingsPageData = {
    meetings: [],
    projects: [],
    isAdmin: false,
  };

  if (!getSupabaseConfig()) {
    return emptyResult;
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return emptyResult;
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  const supabase = await createClient();

  // 1. Fetch available projects for dropdowns/filter
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", membership.organizationId)
    .order("name", { ascending: true });

  // 2. Fetch meetings
  let query = supabase
    .from("meetings")
    .select("*, projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .order("meeting_date", { ascending: false });

  if (projectId && projectId !== "ALL") {
    query = query.eq("project_id", projectId);
  }

  const { data: rawMeetings } = await query;

  // 3. Count decisions per meeting
  const { data: rawDecisions } = await supabase
    .from("decisions")
    .select("meeting_id")
    .eq("organization_id", membership.organizationId)
    .not("meeting_id", "is", null);

  const decisionCountMap = new Map<string, number>();
  if (rawDecisions) {
    for (const d of rawDecisions) {
      if (!d.meeting_id) continue;
      decisionCountMap.set(d.meeting_id, (decisionCountMap.get(d.meeting_id) ?? 0) + 1);
    }
  }

  const meetings: MeetingWithStats[] = (rawMeetings ?? []).map((m) => {
    const proj = m.projects as { id: string; name: string } | null;
    return {
      ...m,
      projectName: proj?.name ?? null,
      decisionCount: decisionCountMap.get(m.id) ?? 0,
    };
  });

  return {
    meetings,
    projects: rawProjects ?? [],
    isAdmin,
  };
}

export async function getMeetingById(id: string): Promise<MeetingDetailData> {
  const emptyResult: MeetingDetailData = {
    meeting: null,
    decisions: [],
    projects: [],
    members: [],
    isAdmin: false,
  };

  if (!getSupabaseConfig()) {
    return emptyResult;
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return emptyResult;
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  const supabase = await createClient();

  // 1. Fetch meeting
  const { data: m } = await supabase
    .from("meetings")
    .select("*, projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .eq("id", id)
    .single();

  if (!m) {
    return emptyResult;
  }

  // 2. Fetch decisions for this meeting
  const { data: decisions } = await supabase
    .from("decisions")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .eq("meeting_id", id)
    .order("decided_at", { ascending: false });

  // 3. Fetch projects
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", membership.organizationId)
    .order("name", { ascending: true });

  // 4. Fetch organization members for task assignee assignment
  const { data: rawMembers } = await supabase
    .from("organization_members")
    .select("user_id, profiles(id, name, email)")
    .eq("organization_id", membership.organizationId);

  const members = (rawMembers ?? []).map((rm) => {
    const p = rm.profiles as { id: string; name: string; email: string } | null;
    return {
      userId: rm.user_id,
      name: p?.name || p?.email?.split("@")[0] || "구성원",
      email: p?.email || "",
    };
  });

  const proj = m.projects as { id: string; name: string } | null;
  const meeting: MeetingWithStats = {
    ...m,
    projectName: proj?.name ?? null,
    decisionCount: decisions?.length ?? 0,
  };

  return {
    meeting,
    decisions: decisions ?? [],
    projects: rawProjects ?? [],
    members,
    isAdmin,
  };
}

export async function createMeeting(
  _prevState: { error: string | null; meetingId?: string; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; meetingId?: string; success?: boolean }> {
  const title = formData.get("title");
  const meetingDate = formData.get("meeting_date");
  const content = formData.get("content");
  const attendees = formData.get("attendees");
  const projectId = formData.get("project_id");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "회의 제목을 입력해 주세요." };
  }
  if (typeof meetingDate !== "string" || !meetingDate.trim()) {
    return { error: "회의 일시를 선택해 주세요." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  const insertPayload: Database["public"]["Tables"]["meetings"]["Insert"] = {
    organization_id: membership.organizationId,
    title: title.trim(),
    meeting_date: new Date(meetingDate).toISOString(),
    content: typeof content === "string" ? content.trim() : "",
    attendees: typeof attendees === "string" && attendees.trim() ? attendees.trim() : null,
    project_id: typeof projectId === "string" && projectId.trim() ? projectId.trim() : null,
  };

  const { data, error } = await supabase
    .from("meetings")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "회의록 등록에 실패했습니다: " + (error?.message ?? "알 수 없는 오류") };
  }

  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  return { error: null, meetingId: data.id, success: true };
}

export async function updateMeeting(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const meetingId = formData.get("meeting_id");
  const title = formData.get("title");
  const meetingDate = formData.get("meeting_date");
  const content = formData.get("content");
  const attendees = formData.get("attendees");
  const projectId = formData.get("project_id");

  if (typeof meetingId !== "string" || !meetingId) {
    return { error: "회의록 ID가 올바르지 않습니다." };
  }
  if (typeof title !== "string" || !title.trim()) {
    return { error: "회의 제목을 입력해 주세요." };
  }
  if (typeof meetingDate !== "string" || !meetingDate.trim()) {
    return { error: "회의 일시를 선택해 주세요." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  const updatePayload: Database["public"]["Tables"]["meetings"]["Update"] = {
    title: title.trim(),
    meeting_date: new Date(meetingDate).toISOString(),
    content: typeof content === "string" ? content.trim() : "",
    attendees: typeof attendees === "string" && attendees.trim() ? attendees.trim() : null,
    project_id: typeof projectId === "string" && projectId.trim() ? projectId.trim() : null,
  };

  const { error } = await supabase
    .from("meetings")
    .update(updatePayload)
    .eq("organization_id", membership.organizationId)
    .eq("id", meetingId);

  if (error) {
    return { error: "회의록 수정에 실패했습니다: " + error.message };
  }

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function deleteMeeting(
  meetingId: string,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "회의록 삭제 권한이 없습니다 (학생회 관리자 전용)." };
  }

  const supabase = await createClient();

  // Delete any child decisions first to respect FK
  await supabase
    .from("decisions")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("meeting_id", meetingId);

  // Delete meeting
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", meetingId);

  if (error) {
    return { error: "회의록 삭제에 실패했습니다: " + error.message };
  }

  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// AI Meeting Analysis & Batch Confirmation
// ---------------------------------------------------------------------------

export interface TaskCandidateWithMatch extends MeetingTaskCandidate {
  matchedUserId: string | null;
}

export interface AnalyzeMeetingActionResult {
  error: string | null;
  data?: {
    summary: string;
    tasks: TaskCandidateWithMatch[];
    decisions: MeetingDecisionCandidate[];
  };
}

export async function analyzeMeetingAction(
  meetingId: string,
): Promise<AnalyzeMeetingActionResult> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, title, content, attendees, project_id, projects(name)")
    .eq("organization_id", membership.organizationId)
    .eq("id", meetingId)
    .single();

  if (error || !meeting) {
    return { error: "회의록을 찾을 수 없습니다." };
  }

  if (!meeting.content || meeting.content.trim().length < 10) {
    return {
      error:
        "회의 내용이 너무 짧아 AI 분석을 진행할 수 없습니다. 회의록 내용을 10자 이상 작성해 주세요.",
    };
  }

  const proj = meeting.projects as { name: string } | null;
  const aiResult = await analyzeMeetingWithAI({
    title: meeting.title,
    content: meeting.content,
    attendees: meeting.attendees,
    projectName: proj?.name ?? null,
  });

  if (!aiResult.success) {
    return { error: aiResult.error };
  }

  // Match suggestedAssigneeName with organization members
  const { data: rawMembers } = await supabase
    .from("organization_members")
    .select("user_id, profiles(name, email)")
    .eq("organization_id", membership.organizationId);

  const membersList = (rawMembers ?? []).map((rm) => {
    const p = rm.profiles as { name: string; email: string } | null;
    return {
      userId: rm.user_id,
      name: (p?.name || "").trim(),
      emailPrefix: (p?.email || "").split("@")[0].trim(),
    };
  });

  const tasksWithMatch: TaskCandidateWithMatch[] = aiResult.data.tasks.map((task) => {
    let matchedUserId: string | null = null;
    if (task.suggestedAssigneeName) {
      const query = task.suggestedAssigneeName.trim().toLowerCase();
      const found = membersList.find(
        (m) =>
          (m.name && m.name.toLowerCase() === query) ||
          (m.name && m.name.toLowerCase().includes(query)) ||
          (m.emailPrefix && m.emailPrefix.toLowerCase() === query),
      );
      if (found) {
        matchedUserId = found.userId;
      }
    }
    return {
      ...task,
      matchedUserId,
    };
  });

  return {
    error: null,
    data: {
      summary: aiResult.data.summary,
      tasks: tasksWithMatch,
      decisions: aiResult.data.decisions,
    },
  };
}

export async function saveMeetingAiSummary(
  meetingId: string,
  summary: string,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  if (!summary.trim()) {
    return { error: "저장할 요약 내용이 비어있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ ai_summary: summary.trim() })
    .eq("organization_id", membership.organizationId)
    .eq("id", meetingId);

  if (error) {
    return { error: "회의록 요약 저장에 실패했습니다: " + error.message };
  }

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meetingId}`);
  return { error: null, success: true };
}

export interface BatchCreateTaskInput {
  title: string;
  description: string;
  dueDate: string | null;
  assigneeId: string | null;
}

export async function batchCreateTasksFromMeeting(
  meetingId: string,
  projectId: string | null,
  tasks: BatchCreateTaskInput[],
): Promise<{ error: string | null; count?: number; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const validTasks = tasks.filter((t) => t.title && t.title.trim().length > 0);
  if (validTasks.length === 0) {
    return { error: "등록할 유효한 태스크가 없습니다." };
  }

  const supabase = await createClient();
  const rows: Database["public"]["Tables"]["tasks"]["Insert"][] = validTasks.map((t) => ({
    organization_id: membership.organizationId,
    project_id: projectId || null,
    assignee_id: t.assigneeId || null,
    title: t.title.trim(),
    description: t.description.trim(),
    status: "TODO",
    due_date: t.dueDate || null,
  }));

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) {
    return { error: "태스크 등록 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath(`/meetings/${meetingId}`);

  return { error: null, count: rows.length, success: true };
}

export interface BatchCreateDecisionInput {
  title: string;
  content: string;
  reason: string;
}

export async function batchCreateDecisionsFromMeeting(
  meetingId: string,
  projectId: string | null,
  decisions: BatchCreateDecisionInput[],
): Promise<{ error: string | null; count?: number; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const validDecisions = decisions.filter(
    (d) => d.title && d.title.trim().length > 0 && d.content && d.content.trim().length > 0,
  );
  if (validDecisions.length === 0) {
    return { error: "등록할 유효한 결정사항이 없습니다. (제목과 내용 필수)" };
  }

  const supabase = await createClient();
  const rows: Database["public"]["Tables"]["decisions"]["Insert"][] = validDecisions.map((d) => ({
    organization_id: membership.organizationId,
    meeting_id: meetingId,
    project_id: projectId || null,
    title: d.title.trim(),
    content: d.content.trim(),
    reason: d.reason.trim() || null,
    decided_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("decisions").insert(rows);
  if (error) {
    return { error: "결정사항 등록 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

  return { error: null, count: rows.length, success: true };
}

// ---------------------------------------------------------------------------
// Real-time STT & AI Context Clarification
// ---------------------------------------------------------------------------

export async function runTranscriptClarification(
  meetingId: string,
  transcript: string,
): Promise<{
  error: string | null;
  data?: TranscriptClarificationResult;
}> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  // Fetch meeting, departments, members
  const [meetingRes, deptsRes, membersRes] = await Promise.all([
    supabase
      .from("meetings")
      .select("title, projects(name)")
      .eq("organization_id", membership.organizationId)
      .eq("id", meetingId)
      .single(),
    supabase
      .from("departments")
      .select("name")
      .eq("organization_id", membership.organizationId),
    supabase
      .from("organization_members")
      .select("profiles(name, email)")
      .eq("organization_id", membership.organizationId),
  ]);

  const meeting = meetingRes.data;
  const projectName = (meeting?.projects as { name: string } | null)?.name ?? null;
  const departments = (deptsRes.data ?? []).map((d) => d.name);
  const members = (membersRes.data ?? [])
    .map((m) => {
      const p = m.profiles as { name: string; email: string } | null;
      return p?.name || p?.email?.split("@")[0] || "";
    })
    .filter(Boolean);

  const aiRes = await clarifyTranscriptWithAI({
    transcript,
    meetingTitle: meeting?.title,
    projectName,
    departments,
    members,
  });

  if (!aiRes.success) {
    return { error: aiRes.error };
  }

  return { error: null, data: aiRes.data };
}

export async function saveTranscriptToMeeting(
  meetingId: string,
  content: string,
  mode: "replace" | "append",
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("meetings")
    .select("content")
    .eq("organization_id", membership.organizationId)
    .eq("id", meetingId)
    .single();

  if (fetchErr || !existing) {
    return { error: "회의록 정보를 불러오지 못했습니다." };
  }

  const newContent =
    mode === "append" && existing.content && existing.content.trim().length > 0
      ? `${existing.content.trim()}\n\n---\n\n${content.trim()}`
      : content.trim();

  const { error: updateErr } = await supabase
    .from("meetings")
    .update({ content: newContent })
    .eq("organization_id", membership.organizationId)
    .eq("id", meetingId);

  if (updateErr) {
    return { error: "회의록 저장 중 오류가 발생했습니다: " + updateErr.message };
  }

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/dashboard");
  return { error: null, success: true };
}


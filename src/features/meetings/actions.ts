"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

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
  isAdmin: boolean;
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

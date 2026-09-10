"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type DecisionRow = Database["public"]["Tables"]["decisions"]["Row"];

export interface DecisionWithContext extends DecisionRow {
  projectName?: string | null;
  meetingTitle?: string | null;
}

export interface DecisionsPageData {
  decisions: DecisionWithContext[];
  projects: Array<{ id: string; name: string }>;
  isAdmin: boolean;
}

export async function getDecisions(projectId?: string): Promise<DecisionsPageData> {
  const emptyResult: DecisionsPageData = {
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

  // 1. Fetch available projects
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", membership.organizationId)
    .order("name", { ascending: true });

  // 2. Fetch decisions with joined projects and meetings
  let query = supabase
    .from("decisions")
    .select("*, projects(id, name), meetings(id, title)")
    .eq("organization_id", membership.organizationId)
    .order("decided_at", { ascending: false });

  if (projectId && projectId !== "ALL") {
    query = query.eq("project_id", projectId);
  }

  const { data: rawDecisions } = await query;

  const decisions: DecisionWithContext[] = (rawDecisions ?? []).map((d) => {
    const proj = d.projects as { id: string; name: string } | null;
    const meet = d.meetings as { id: string; title: string } | null;
    return {
      ...d,
      projectName: proj?.name ?? null,
      meetingTitle: meet?.title ?? null,
    };
  });

  return {
    decisions,
    projects: rawProjects ?? [],
    isAdmin,
  };
}

export async function createDecision(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const title = formData.get("title");
  const content = formData.get("content");
  const reason = formData.get("reason");
  const meetingId = formData.get("meeting_id");
  const projectId = formData.get("project_id");
  const decidedAt = formData.get("decided_at");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "결정사항 제목을 입력해 주세요." };
  }
  if (typeof content !== "string" || !content.trim()) {
    return { error: "결정 내용을 구체적으로 입력해 주세요." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  const insertPayload: Database["public"]["Tables"]["decisions"]["Insert"] = {
    organization_id: membership.organizationId,
    title: title.trim(),
    content: content.trim(),
    reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    meeting_id: typeof meetingId === "string" && meetingId.trim() ? meetingId.trim() : null,
    project_id: typeof projectId === "string" && projectId.trim() ? projectId.trim() : null,
    decided_at:
      typeof decidedAt === "string" && decidedAt.trim()
        ? new Date(decidedAt).toISOString()
        : new Date().toISOString(),
  };

  const { error } = await supabase.from("decisions").insert(insertPayload);

  if (error) {
    return { error: "결정사항 등록에 실패했습니다: " + error.message };
  }

  revalidatePath("/meetings");
  if (typeof meetingId === "string" && meetingId.trim()) {
    revalidatePath(`/meetings/${meetingId.trim()}`);
  }
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function updateDecision(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const decisionId = formData.get("decision_id");
  const title = formData.get("title");
  const content = formData.get("content");
  const reason = formData.get("reason");
  const meetingId = formData.get("meeting_id");
  const projectId = formData.get("project_id");
  const decidedAt = formData.get("decided_at");

  if (typeof decisionId !== "string" || !decisionId) {
    return { error: "결정사항 ID가 올바르지 않습니다." };
  }
  if (typeof title !== "string" || !title.trim()) {
    return { error: "결정사항 제목을 입력해 주세요." };
  }
  if (typeof content !== "string" || !content.trim()) {
    return { error: "결정 내용을 구체적으로 입력해 주세요." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  const updatePayload: Database["public"]["Tables"]["decisions"]["Update"] = {
    title: title.trim(),
    content: content.trim(),
    reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
    meeting_id: typeof meetingId === "string" && meetingId.trim() ? meetingId.trim() : null,
    project_id: typeof projectId === "string" && projectId.trim() ? projectId.trim() : null,
    decided_at:
      typeof decidedAt === "string" && decidedAt.trim()
        ? new Date(decidedAt).toISOString()
        : new Date().toISOString(),
  };

  const { error } = await supabase
    .from("decisions")
    .update(updatePayload)
    .eq("organization_id", membership.organizationId)
    .eq("id", decisionId);

  if (error) {
    return { error: "결정사항 수정에 실패했습니다: " + error.message };
  }

  revalidatePath("/meetings");
  if (typeof meetingId === "string" && meetingId.trim()) {
    revalidatePath(`/meetings/${meetingId.trim()}`);
  }
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function deleteDecision(
  decisionId: string,
  meetingId?: string | null,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "결정사항 삭제 권한이 없습니다 (학생회 관리자 전용)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("decisions")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", decisionId);

  if (error) {
    return { error: "결정사항 삭제에 실패했습니다: " + error.message };
  }

  revalidatePath("/meetings");
  if (meetingId) {
    revalidatePath(`/meetings/${meetingId}`);
  }
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export type ActionState = {
  error: string | null;
  success?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function getCurrentUserOrganization() {
  if (!getSupabaseConfig()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, university_name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member || !member.organizations) return null;

  return {
    organizationId: member.organization_id,
    role: member.role,
    organization: member.organizations,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getProjects(statusFilter?: ProjectStatus | "ALL") {
  if (!getSupabaseConfig()) return [];

  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, tasks(id, status)")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function getProjectById(projectId: string) {
  if (!getSupabaseConfig()) return null;

  const membership = await getCurrentUserOrganization();
  if (!membership) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, tasks(*)")
    .eq("organization_id", membership.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getDashboardProjectSummaries() {
  if (!getSupabaseConfig()) {
    return { inProgressCount: 0, totalCount: 0, recentProjects: [] };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { inProgressCount: 0, totalCount: 0, recentProjects: [] };
  }

  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, description, status, start_date, end_date, created_at, tasks(id, status)")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (error || !projects) {
    return { inProgressCount: 0, totalCount: 0, recentProjects: [] };
  }

  const inProgress = projects.filter((p) => p.status === "IN_PROGRESS");

  return {
    inProgressCount: inProgress.length,
    totalCount: projects.length,
    recentProjects: projects.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createProject(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직이 없습니다. 먼저 조직에 참여해 주세요." };
  }

  const name = formData.get("name");
  const description = (formData.get("description") as string) || "";
  const status = (formData.get("status") as ProjectStatus) || "PLANNED";
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  if (typeof name !== "string" || !name.trim()) {
    return { error: "프로젝트 이름을 입력해 주세요." };
  }

  if (startDate && endDate && endDate < startDate) {
    return { error: "종료일은 시작일 이후여야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    organization_id: membership.organizationId,
    name: name.trim(),
    description: description.trim(),
    status,
    start_date: startDate || null,
    end_date: endDate || null,
  });

  if (error) {
    return { error: "프로젝트 생성 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function updateProject(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = formData.get("project_id");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "수정할 프로젝트 ID가 올바르지 않습니다." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직이 없습니다." };
  }

  const name = formData.get("name");
  const description = (formData.get("description") as string) || "";
  const status = formData.get("status") as ProjectStatus;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  if (typeof name !== "string" || !name.trim()) {
    return { error: "프로젝트 이름을 입력해 주세요." };
  }

  if (startDate && endDate && endDate < startDate) {
    return { error: "종료일은 시작일 이후여야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: name.trim(),
      description: description.trim(),
      status,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", projectId);

  if (error) {
    return { error: "프로젝트 수정 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function deleteProject(projectId: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직이 없습니다." };
  }

  if (!["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role)) {
    return { error: "프로젝트 삭제는 학생회 관리자만 가능합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", projectId);

  if (error) {
    return { error: "프로젝트 삭제 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

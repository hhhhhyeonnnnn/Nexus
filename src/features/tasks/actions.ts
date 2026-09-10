"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import type { Database } from "@/types/database";

type TaskStatus = Database["public"]["Enums"]["task_status"];

export type TaskWithDetails = Database["public"]["Tables"]["tasks"]["Row"] & {
  projects?: { id: string; name: string } | null;
  departments?: { id: string; name: string; color: string } | null;
  assigneeName?: string | null;
};

export type ActionState = {
  error: string | null;
  success?: boolean;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getTasks(options?: {
  projectId?: string;
  status?: TaskStatus | "ALL";
  assigneeId?: string;
  departmentId?: string;
}): Promise<TaskWithDetails[]> {
  if (!getSupabaseConfig()) return [];

  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();

  // 1. Fetch tasks with project and department relations
  let query = supabase
    .from("tasks")
    .select("*, projects(id, name), departments(id, name, color)")
    .eq("organization_id", membership.organizationId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (options?.projectId && options.projectId !== "ALL") {
    query = query.eq("project_id", options.projectId);
  }

  if (options?.status && options.status !== "ALL") {
    query = query.eq("status", options.status);
  }

  if (options?.assigneeId && options.assigneeId !== "ALL") {
    query = query.eq("assignee_id", options.assigneeId);
  }

  if (options?.departmentId && options.departmentId !== "ALL") {
    query = query.eq("department_id", options.departmentId);
  }

  const { data: rawTasks, error } = await query;
  if (error || !rawTasks) return [];

  // 2. Fetch member names for assignee mapping
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, profiles(id, name, email)")
    .eq("organization_id", membership.organizationId);

  const memberNameMap = new Map<string, string>();
  if (members) {
    for (const m of members) {
      const displayName = m.profiles?.name || m.profiles?.email?.split("@")[0];
      if (displayName) {
        memberNameMap.set(m.user_id, displayName);
      }
    }
  }

  return rawTasks.map((task) => ({
    ...task,
    assigneeName: task.assignee_id ? memberNameMap.get(task.assignee_id) ?? "알 수 없음" : null,
  }));
}

export async function getOrganizationMembersList() {
  if (!getSupabaseConfig()) return [];

  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      user_id,
      role,
      profiles(id, name, email)
    `)
    .eq("organization_id", membership.organizationId);

  if (error) return [];
  return data ?? [];
}

export async function getDashboardTaskSummaries(): Promise<{
  dueSoonCount: number;
  unassignedCount: number;
  urgentTasks: TaskWithDetails[];
}> {
  if (!getSupabaseConfig()) {
    return { dueSoonCount: 0, unassignedCount: 0, urgentTasks: [] };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { dueSoonCount: 0, unassignedCount: 0, urgentTasks: [] };
  }

  const supabase = await createClient();
  const { data: rawTasks, error } = await supabase
    .from("tasks")
    .select("*, projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .neq("status", "DONE")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error || !rawTasks) {
    return { dueSoonCount: 0, unassignedCount: 0, urgentTasks: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  let dueSoonCount = 0;
  let unassignedCount = 0;

  for (const t of rawTasks) {
    if (!t.assignee_id) unassignedCount++;
    if (t.due_date) {
      const d = new Date(t.due_date);
      if (d <= threeDaysLater) {
        dueSoonCount++;
      }
    }
  }

  // Fetch member names
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, profiles(id, name, email)")
    .eq("organization_id", membership.organizationId);

  const memberNameMap = new Map<string, string>();
  if (members) {
    for (const m of members) {
      const displayName = m.profiles?.name || m.profiles?.email?.split("@")[0];
      if (displayName) {
        memberNameMap.set(m.user_id, displayName);
      }
    }
  }

  const urgentTasks: TaskWithDetails[] = rawTasks.slice(0, 5).map((task) => ({
    ...task,
    assigneeName: task.assignee_id ? memberNameMap.get(task.assignee_id) ?? null : null,
  }));

  return {
    dueSoonCount,
    unassignedCount,
    urgentTasks,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직이 없습니다." };
  }

  const title = formData.get("title");
  const description = (formData.get("description") as string) || "";
  const projectId = (formData.get("project_id") as string) || null;
  const assigneeId = (formData.get("assignee_id") as string) || null;
  const departmentId = (formData.get("department_id") as string) || null;
  const dueDate = (formData.get("due_date") as string) || null;
  const status = (formData.get("status") as TaskStatus) || "TODO";

  if (typeof title !== "string" || !title.trim()) {
    return { error: "업무 제목을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    organization_id: membership.organizationId,
    project_id: projectId || null,
    assignee_id: assigneeId || null,
    department_id: departmentId || null,
    title: title.trim(),
    description: description.trim(),
    status,
    due_date: dueDate || null,
  });

  if (error) {
    return { error: "업무 등록 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { error: null, success: true };
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  projectId?: string | null,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 정보를 찾을 수 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("organization_id", membership.organizationId)
    .eq("id", taskId);

  if (error) {
    return { error: "상태 변경에 실패했습니다: " + error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { error: null, success: true };
}

export async function updateTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const taskId = formData.get("task_id");
  if (typeof taskId !== "string" || !taskId) {
    return { error: "업무 ID가 올바르지 않습니다." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "소속된 학생회 조직이 없습니다." };

  const title = formData.get("title");
  const description = (formData.get("description") as string) || "";
  const projectId = (formData.get("project_id") as string) || null;
  const assigneeId = (formData.get("assignee_id") as string) || null;
  const departmentId = (formData.get("department_id") as string) || null;
  const dueDate = (formData.get("due_date") as string) || null;
  const status = (formData.get("status") as TaskStatus) || "TODO";

  if (typeof title !== "string" || !title.trim()) {
    return { error: "업무 제목을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      description: description.trim(),
      project_id: projectId || null,
      assignee_id: assigneeId || null,
      department_id: departmentId || null,
      status,
      due_date: dueDate || null,
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", taskId);

  if (error) {
    return { error: "업무 수정 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { error: null, success: true };
}

export async function deleteTask(
  taskId: string,
  projectId?: string | null,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "소속된 학생회 조직이 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", taskId);

  if (error) {
    return { error: "업무 삭제 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { error: null, success: true };
}

export async function getOrganizationDepartmentsList(): Promise<
  Array<{ id: string; name: string; color: string }>
> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name, color")
    .eq("organization_id", membership.organizationId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (data as Array<{ id: string; name: string; color: string }>) || [];
}


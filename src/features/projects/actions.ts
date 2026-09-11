"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export type ActionState = {
  error: string | null;
  success?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type UserRoleType = "EXECUTIVE" | "HEAD" | "MEMBER";

function determineUserRoleType(
  role: Database["public"]["Enums"]["organization_role"],
  jobTitle: string | null,
  departmentId: string | null
): UserRoleType {
  if (role === "PRESIDENT" || role === "VICE_PRESIDENT") {
    return "EXECUTIVE";
  }
  if (role === "ADMIN" && !departmentId) {
    return "EXECUTIVE";
  }
  if (departmentId) {
    const title = jobTitle ?? "";
    if (
      title.includes("국장") ||
      title.includes("부장") ||
      title.includes("팀장") ||
      title.includes("장") ||
      role === "ADMIN"
    ) {
      return "HEAD";
    }
  }
  return "MEMBER";
}

export interface CurrentUserOrganization {
  userId: string;
  organizationId: string;
  role: Database["public"]["Enums"]["organization_role"];
  departmentId: string | null;
  departmentName: string | null;
  jobTitle: string | null;
  userRoleType: UserRoleType;
  organization: {
    id: string;
    name: string;
    university_name: string;
  };
}

export const getCurrentUserOrganization = cache(async (): Promise<CurrentUserOrganization | null> => {
  if (!getSupabaseConfig()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select(
      "organization_id, role, department_id, job_title, departments(id, name), organizations(id, name, university_name)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member || !member.organizations) return null;

  const userRoleType = determineUserRoleType(
    member.role,
    member.job_title,
    member.department_id
  );

  const dept = member.departments as { id: string; name: string } | null;

  return {
    userId: user.id,
    organizationId: member.organization_id,
    role: member.role,
    departmentId: member.department_id,
    departmentName: dept?.name ?? null,
    jobTitle: member.job_title,
    userRoleType,
    organization: member.organizations,
  };
});

export async function getUserRoleContextAction(): Promise<CurrentUserOrganization | null> {
  return getCurrentUserOrganization();
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

export async function getDashboardBudgetSummary() {
  if (!getSupabaseConfig()) {
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("type, actual_amount")
    .eq("organization_id", membership.organizationId);

  if (error || !data) {
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }

  const totalIncome = data
    .filter((b) => b.type === "INCOME")
    .reduce((sum, b) => sum + (b.actual_amount ?? 0), 0);
  const totalExpense = data
    .filter((b) => b.type === "EXPENSE")
    .reduce((sum, b) => sum + (b.actual_amount ?? 0), 0);

  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

export type ActivityItem = {
  type: "task" | "meeting" | "decision" | "budget";
  title: string;
  subtitle: string | null;
  href: string;
  createdAt: string;
};

export async function getDashboardActivityFeed(): Promise<ActivityItem[]> {
  if (!getSupabaseConfig()) return [];

  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  const orgId = membership.organizationId;

  const [tasks, meetings, decisions, budgets] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, project_id, created_at, projects(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("meetings")
      .select("id, title, created_at, projects(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("decisions")
      .select("id, title, decided_at, projects(name)")
      .eq("organization_id", orgId)
      .order("decided_at", { ascending: false })
      .limit(5),
    supabase
      .from("budgets")
      .select("id, title, type, created_at, projects(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: ActivityItem[] = [
    ...(tasks.data ?? []).map((t) => ({
      type: "task" as const,
      title: t.title,
      subtitle: (t.projects as { name: string } | null)?.name ?? null,
      href: t.project_id ? `/projects/${t.project_id}` : "/tasks",
      createdAt: t.created_at,
    })),
    ...(meetings.data ?? []).map((m) => ({
      type: "meeting" as const,
      title: m.title,
      subtitle: (m.projects as { name: string } | null)?.name ?? null,
      href: `/meetings/${m.id}`,
      createdAt: m.created_at,
    })),
    ...(decisions.data ?? []).map((d) => ({
      type: "decision" as const,
      title: d.title,
      subtitle: (d.projects as { name: string } | null)?.name ?? null,
      href: `/meetings`,
      createdAt: d.decided_at ?? new Date(0).toISOString(),
    })),
    ...(budgets.data ?? []).map((b) => ({
      type: "budget" as const,
      title: b.title,
      subtitle: (b.type === "INCOME" ? "수입" : "지출") + ((b.projects as { name: string } | null)?.name ? ` · ${(b.projects as { name: string }).name}` : ""),
      href: "/finance",
      createdAt: b.created_at,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
}

export async function getProjectBudgetSummary(projectId: string) {
  if (!getSupabaseConfig()) {
    return { plannedAmount: 0, actualAmount: 0, executionRate: 0 };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { plannedAmount: 0, actualAmount: 0, executionRate: 0 };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("planned_amount, actual_amount, type")
    .eq("organization_id", membership.organizationId)
    .eq("project_id", projectId);

  if (error || !data || data.length === 0) {
    return { plannedAmount: 0, actualAmount: 0, executionRate: 0 };
  }

  // Only expense items for execution rate
  const expenses = data.filter((b) => b.type === "EXPENSE");
  const plannedAmount = expenses.reduce((sum, b) => sum + (b.planned_amount ?? 0), 0);
  const actualAmount = expenses.reduce((sum, b) => sum + (b.actual_amount ?? 0), 0);
  const executionRate = plannedAmount > 0 ? Math.min(100, (actualAmount / plannedAmount) * 100) : 0;

  return { plannedAmount, actualAmount, executionRate };
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

export interface ControlTowerMetrics {
  pendingApprovalsCount: number;
  missingReceiptsCount: number;
  openFormsCount: number;
  totalSubmissionsCount: number;
  pendingPetitionsCount: number;
}

export async function getDashboardControlTowerMetrics(): Promise<ControlTowerMetrics> {
  const fallback: ControlTowerMetrics = {
    pendingApprovalsCount: 0,
    missingReceiptsCount: 0,
    openFormsCount: 0,
    totalSubmissionsCount: 0,
    pendingPetitionsCount: 0,
  };

  if (!getSupabaseConfig()) return fallback;
  const membership = await getCurrentUserOrganization();
  if (!membership) return fallback;

  const supabase = await createClient();
  const orgId = membership.organizationId;

  const [approvalsRes, budgetsRes, formsRes, submissionsRes, petitionsRes] = await Promise.all([
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "PENDING"),
    supabase
      .from("budgets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("type", "EXPENSE")
      .is("receipt_url", null),
    supabase
      .from("event_forms")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "OPEN"),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("petitions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "PENDING"),
  ]);

  return {
    pendingApprovalsCount: approvalsRes.count ?? 0,
    missingReceiptsCount: budgetsRes.count ?? 0,
    openFormsCount: formsRes.count ?? 0,
    totalSubmissionsCount: submissionsRes.count ?? 0,
    pendingPetitionsCount: petitionsRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Member Focus Home & Department Head Data
// ---------------------------------------------------------------------------

export interface MemberHomeData {
  myTasks: Array<{
    id: string;
    title: string;
    status: Database["public"]["Enums"]["task_status"];
    due_date: string | null;
    project_id: string | null;
    projectName?: string | null;
  }>;
  myProjects: Array<{
    id: string;
    name: string;
    status: string;
    progressPercentage: number;
  }>;
  todayEvents: Array<{
    id: string;
    title: string;
    start_at: string;
    end_at: string;
  }>;
  myRecentBudgets: Array<{
    id: string;
    title: string;
    actual_amount: number;
    transaction_date: string;
    receipt_url: string | null;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    created_at: string;
    is_pinned: boolean;
  }>;
}

export async function getMemberHomeData(): Promise<MemberHomeData> {
  const fallback: MemberHomeData = {
    myTasks: [],
    myProjects: [],
    todayEvents: [],
    myRecentBudgets: [],
    recentAnnouncements: [],
  };

  if (!getSupabaseConfig()) return fallback;
  const membership = await getCurrentUserOrganization();
  if (!membership) return fallback;

  const supabase = await createClient();
  const orgId = membership.organizationId;
  const userId = membership.userId;

  const [tasksRes, projectsRes, eventsRes, announcementsRes, budgetsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, due_date, project_id, projects(id, name)")
      .eq("organization_id", orgId)
      .eq("assignee_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10),
    supabase
      .from("projects")
      .select("id, name, status, tasks(id, status)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("events")
      .select("id, title, start_at, end_at")
      .eq("organization_id", orgId)
      .gte("end_at", new Date(Date.now() - 86400000).toISOString())
      .order("start_at", { ascending: true })
      .limit(5),
    supabase
      .from("announcements")
      .select("id, title, created_at, is_pinned")
      .eq("organization_id", orgId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("budgets")
      .select("id, title, actual_amount, planned_amount, transaction_date, receipt_url")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const myTasks = (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_date: t.due_date,
    project_id: t.project_id,
    projectName: (t.projects as { name: string } | null)?.name ?? null,
  }));

  const myProjects = (projectsRes.data ?? []).map((p) => {
    const tasks = (p.tasks as Array<{ id: string; status: string }> | null) ?? [];
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const progressPercentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      progressPercentage,
    };
  });

  const todayEvents = eventsRes.data ?? [];
  const recentAnnouncements = announcementsRes.data ?? [];
  const myRecentBudgets = (budgetsRes.data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    actual_amount: Number(b.actual_amount || b.planned_amount || 0),
    transaction_date: b.transaction_date,
    receipt_url: b.receipt_url,
  }));

  return {
    myTasks,
    myProjects,
    todayEvents,
    myRecentBudgets,
    recentAnnouncements,
  };
}

export interface DepartmentHeadData {
  department: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  departmentMetrics: {
    overdueTasksCount: number;
    dueSoonTasksCount: number;
    unassignedTasksCount: number;
    pendingApprovalsCount: number;
    missingReceiptsCount: number;
    totalExpenseAmount: number;
  };
  departmentMembers: Array<{
    userId: string;
    name: string;
    jobTitle: string | null;
    ongoingTasksCount: number;
    doneTasksCount: number;
  }>;
  departmentProjects: Array<{
    id: string;
    name: string;
    status: string;
    progressPercentage: number;
  }>;
  departmentTasks: Array<{
    id: string;
    title: string;
    status: Database["public"]["Enums"]["task_status"];
    due_date: string | null;
    assigneeName: string | null;
  }>;
}

export async function getDepartmentDashboardData(
  targetDepartmentId?: string | null
): Promise<DepartmentHeadData> {
  const fallback: DepartmentHeadData = {
    department: null,
    departmentMetrics: {
      overdueTasksCount: 0,
      dueSoonTasksCount: 0,
      unassignedTasksCount: 0,
      pendingApprovalsCount: 0,
      missingReceiptsCount: 0,
      totalExpenseAmount: 0,
    },
    departmentMembers: [],
    departmentProjects: [],
    departmentTasks: [],
  };

  if (!getSupabaseConfig()) return fallback;
  const membership = await getCurrentUserOrganization();
  if (!membership) return fallback;

  const supabase = await createClient();
  const orgId = membership.organizationId;
  const deptId = targetDepartmentId ?? membership.departmentId;

  let deptInfo = null;
  if (deptId) {
    const { data: dept } = await supabase
      .from("departments")
      .select("id, name, color")
      .eq("organization_id", orgId)
      .eq("id", deptId)
      .maybeSingle();
    deptInfo = dept;
  } else {
    const { data: firstDept } = await supabase
      .from("departments")
      .select("id, name, color")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    deptInfo = firstDept;
  }

  const effectiveDeptId = deptInfo?.id;
  if (!effectiveDeptId) return fallback;

  const [tasksRes, membersRes, approvalsRes, budgetsRes, projectsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, due_date, assignee_id")
      .eq("organization_id", orgId)
      .eq("department_id", effectiveDeptId)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_members")
      .select("user_id, job_title, profiles(id, name, email)")
      .eq("organization_id", orgId)
      .eq("department_id", effectiveDeptId),
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("department_id", effectiveDeptId)
      .eq("status", "PENDING"),
    supabase
      .from("budgets")
      .select("actual_amount, planned_amount, type, receipt_url")
      .eq("organization_id", orgId)
      .eq("department_id", effectiveDeptId),
    supabase
      .from("projects")
      .select("id, name, status, tasks(id, status)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const rawTasks = tasksRes.data ?? [];
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 86400000);

  let overdueTasksCount = 0;
  let dueSoonTasksCount = 0;
  let unassignedTasksCount = 0;

  for (const t of rawTasks) {
    if (t.status !== "DONE") {
      if (!t.assignee_id) unassignedTasksCount++;
      if (t.due_date) {
        const d = new Date(t.due_date);
        if (d < now) overdueTasksCount++;
        else if (d <= threeDaysLater) dueSoonTasksCount++;
      }
    }
  }

  let totalExpenseAmount = 0;
  let missingReceiptsCount = 0;
  for (const b of budgetsRes.data ?? []) {
    if (b.type === "EXPENSE") {
      totalExpenseAmount += Number(b.actual_amount || b.planned_amount || 0);
      if (!b.receipt_url) missingReceiptsCount++;
    }
  }

  const memberMap = new Map<string, string>();
  for (const m of membersRes.data ?? []) {
    const p = m.profiles as { name: string; email: string } | null;
    const name = p?.name || p?.email?.split("@")[0] || "부원";
    memberMap.set(m.user_id, name);
  }

  const departmentMembers = (membersRes.data ?? []).map((m) => {
    const p = m.profiles as { name: string; email: string } | null;
    const name = p?.name || p?.email?.split("@")[0] || "부원";
    const userTasks = rawTasks.filter((t) => t.assignee_id === m.user_id);
    return {
      userId: m.user_id,
      name,
      jobTitle: m.job_title,
      ongoingTasksCount: userTasks.filter((t) => t.status !== "DONE").length,
      doneTasksCount: userTasks.filter((t) => t.status === "DONE").length,
    };
  });

  const departmentProjects = (projectsRes.data ?? []).map((p) => {
    const pTasks = (p.tasks as Array<{ id: string; status: string }> | null) ?? [];
    const total = pTasks.length;
    const done = pTasks.filter((t) => t.status === "DONE").length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      progressPercentage: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  const departmentTasks = rawTasks.slice(0, 8).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_date: t.due_date,
    assigneeName: t.assignee_id ? memberMap.get(t.assignee_id) ?? null : null,
  }));

  return {
    department: deptInfo,
    departmentMetrics: {
      overdueTasksCount,
      dueSoonTasksCount,
      unassignedTasksCount,
      pendingApprovalsCount: approvalsRes.count ?? 0,
      missingReceiptsCount,
      totalExpenseAmount,
    },
    departmentMembers,
    departmentProjects,
    departmentTasks,
  };
}



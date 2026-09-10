"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];

export interface DepartmentMemberInfo {
  userId: string;
  name: string;
  email: string;
  role: Database["public"]["Enums"]["organization_role"];
  jobTitle: string | null;
}

export interface DepartmentWithMembers extends DepartmentRow {
  members: DepartmentMemberInfo[];
  leader: DepartmentMemberInfo | null;
}

export interface OrgChartPageData {
  organization: {
    id: string;
    name: string;
    universityName: string;
  } | null;
  executiveMembers: DepartmentMemberInfo[];
  departments: DepartmentWithMembers[];
  unassignedMembers: DepartmentMemberInfo[];
  isAdmin: boolean;
}

export type ActionState = {
  error: string | null;
  success?: boolean;
};

export async function getDepartmentsWithMembers(): Promise<OrgChartPageData> {
  const empty: OrgChartPageData = {
    organization: null,
    executiveMembers: [],
    departments: [],
    unassignedMembers: [],
    isAdmin: false,
  };

  if (!getSupabaseConfig()) return empty;

  const membership = await getCurrentUserOrganization();
  if (!membership) return empty;

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  const supabase = await createClient();

  // 1. Fetch organization details
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, university_name")
    .eq("id", membership.organizationId)
    .single();

  if (!org) return empty;

  // 2. Fetch departments
  const { data: rawDepts } = await supabase
    .from("departments")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  // 3. Fetch all members with profiles
  const { data: rawMembers } = await supabase
    .from("organization_members")
    .select("user_id, role, department_id, job_title, profiles(id, name, email)")
    .eq("organization_id", membership.organizationId);

  const allMembers: Array<DepartmentMemberInfo & { departmentId: string | null }> = (
    rawMembers ?? []
  ).map((m) => {
    const p = m.profiles as { id: string; name: string; email: string } | null;
    return {
      userId: m.user_id,
      name: p?.name || p?.email?.split("@")[0] || "구성원",
      email: p?.email || "",
      role: m.role,
      jobTitle: m.job_title,
      departmentId: m.department_id,
    };
  });

  // 4. Group members
  const executiveMembers = allMembers.filter((m) =>
    ["PRESIDENT", "VICE_PRESIDENT"].includes(m.role),
  );

  const deptMap = new Map<string, DepartmentMemberInfo[]>();
  for (const m of allMembers) {
    if (m.departmentId) {
      const list = deptMap.get(m.departmentId) ?? [];
      list.push(m);
      deptMap.set(m.departmentId, list);
    }
  }

  const departments: DepartmentWithMembers[] = (rawDepts ?? []).map((d) => {
    const deptMembers = deptMap.get(d.id) ?? [];
    // Identify department leader (job_title contains '국장' or '부장' or '팀장', or first ADMIN, or first member)
    const leader =
      deptMembers.find(
        (m) =>
          m.jobTitle &&
          (m.jobTitle.includes("국장") ||
            m.jobTitle.includes("부장") ||
            m.jobTitle.includes("팀장") ||
            m.jobTitle.includes("장")),
      ) ||
      deptMembers.find((m) => ["ADMIN", "PRESIDENT", "VICE_PRESIDENT"].includes(m.role)) ||
      (deptMembers.length > 0 ? deptMembers[0] : null);

    return {
      ...d,
      members: deptMembers,
      leader: leader ?? null,
    };
  });

  // Unassigned: not executive and no department
  const unassignedMembers = allMembers.filter(
    (m) => !m.departmentId && !["PRESIDENT", "VICE_PRESIDENT"].includes(m.role),
  );

  return {
    organization: {
      id: org.id,
      name: org.name,
      universityName: org.university_name,
    },
    executiveMembers,
    departments,
    unassignedMembers,
    isAdmin,
  };
}

export async function createDepartment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "부서 생성 권한이 없습니다 (관리자 전용)." };
  }

  const name = formData.get("name");
  const description = (formData.get("description") as string) || "";
  const color = (formData.get("color") as string) || "blue";
  const sortOrderStr = formData.get("sort_order") as string;
  const sortOrder = sortOrderStr ? parseInt(sortOrderStr, 10) : 0;

  if (typeof name !== "string" || !name.trim()) {
    return { error: "부서 이름을 입력해 주세요 (예: 기획국, 홍보국)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    organization_id: membership.organizationId,
    name: name.trim(),
    description: description.trim(),
    color: color.trim(),
    sort_order: isNaN(sortOrder) ? 0 : sortOrder,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 동일한 이름의 부서가 존재합니다." };
    }
    return { error: "부서 생성 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/members");
  revalidatePath("/tasks");
  revalidatePath("/finance");
  return { error: null, success: true };
}

export async function updateDepartment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "부서 수정 권한이 없습니다 (관리자 전용)." };
  }

  const departmentId = formData.get("department_id") as string;
  const name = formData.get("name");
  const description = (formData.get("description") as string) || "";
  const color = (formData.get("color") as string) || "blue";
  const sortOrderStr = formData.get("sort_order") as string;
  const sortOrder = sortOrderStr ? parseInt(sortOrderStr, 10) : 0;

  if (!departmentId) {
    return { error: "수정할 부서 ID를 찾을 수 없습니다." };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { error: "부서 이름을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({
      name: name.trim(),
      description: description.trim(),
      color: color.trim(),
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", departmentId);

  if (error) {
    return { error: "부서 수정 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/members");
  revalidatePath("/tasks");
  revalidatePath("/finance");
  return { error: null, success: true };
}

export async function deleteDepartment(
  departmentId: string,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "부서 삭제 권한이 없습니다 (관리자 전용)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", departmentId);

  if (error) {
    return { error: "부서 삭제 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/members");
  revalidatePath("/tasks");
  revalidatePath("/finance");
  return { error: null, success: true };
}

export async function assignMemberDepartment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "구성원 부서 배정 권한이 없습니다 (관리자 전용)." };
  }

  const targetUserId = formData.get("target_user_id") as string;
  const departmentId = (formData.get("department_id") as string) || null;
  const jobTitle = (formData.get("job_title") as string) || null;

  if (!targetUserId) {
    return { error: "배정 대상 구성원을 선택해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({
      department_id: departmentId && departmentId.trim() ? departmentId.trim() : null,
      job_title: jobTitle && jobTitle.trim() ? jobTitle.trim() : null,
    })
    .eq("organization_id", membership.organizationId)
    .eq("user_id", targetUserId);

  if (error) {
    return { error: "부서 배정 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/members");
  return { error: null, success: true };
}

export async function batchSetupDefaultDepartments(): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "소속된 학생회 조직 정보를 찾을 수 없습니다." };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  if (!isAdmin) {
    return { error: "부서 생성 권한이 없습니다 (관리자 전용)." };
  }

  const supabase = await createClient();

  const defaults = [
    {
      organization_id: membership.organizationId,
      name: "기획국",
      description: "대학 축제, 오리엔테이션, 대동제 등 주요 학생회 행사 기획 및 총괄",
      color: "blue",
      sort_order: 1,
    },
    {
      organization_id: membership.organizationId,
      name: "사무재정국",
      description: "학생회비 회계 장부 결산, 예산 집행 관리 및 영수증 증빙 총괄",
      color: "emerald",
      sort_order: 2,
    },
    {
      organization_id: membership.organizationId,
      name: "홍보디자인국",
      description: "학생회 SNS 운영, 카드뉴스 및 포스터 디자인, 공지사항 전달",
      color: "purple",
      sort_order: 3,
    },
    {
      organization_id: membership.organizationId,
      name: "복지대외협력국",
      description: "제휴 업체 발굴 및 관리, 시험기간 간식 행사, 학생 복지 지원",
      color: "amber",
      sort_order: 4,
    },
  ];

  const { error } = await supabase.from("departments").insert(defaults);
  if (error) {
    return { error: "기본 부서 생성 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath("/members");
  revalidatePath("/tasks");
  revalidatePath("/finance");
  return { error: null, success: true };
}

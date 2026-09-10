"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type ApprovalRow = Database["public"]["Tables"]["approvals"]["Row"];
export type ApprovalLogRow = Database["public"]["Tables"]["approval_logs"]["Row"];

export interface ApprovalStepItem {
  step: number;
  name: string;
  role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approver_id?: string | null;
  approver_name?: string | null;
  comment?: string | null;
  decided_at?: string | null;
}

export interface ApprovalWithRelations extends ApprovalRow {
  profiles?: { id: string; name: string | null; email: string | null } | null;
  departments?: { id: string; name: string } | null;
  projects?: { id: string; name: string } | null;
  approval_logs?: ApprovalLogRow[];
}

export type ActionState = {
  error: string | null;
  success?: boolean;
};

// ---------------------------------------------------------------------------
// Approvals Query & Actions
// ---------------------------------------------------------------------------

export async function getApprovals(
  statusFilter?: string,
  typeFilter?: string
): Promise<ApprovalWithRelations[]> {
  if (!getSupabaseConfig()) return [];
  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  let query = supabase
    .from("approvals")
    .select(`
      *,
      profiles(id, name, email),
      departments(id, name),
      projects(id, name),
      approval_logs(*)
    `)
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }
  if (typeFilter && typeFilter !== "ALL") {
    query = query.eq("type", typeFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("결재 문서 목록 조회 오류:", error);
    return [];
  }

  return (data as unknown as ApprovalWithRelations[]) ?? [];
}

export async function createApproval(formData: {
  title: string;
  type: "EXPENSE" | "EVENT" | "GENERAL";
  amount?: number;
  content: string;
  department_id?: string;
  project_id?: string;
  steps: Array<{ step: number; name: string; role: string }>;
}): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  if (!formData.title?.trim() || !formData.content?.trim()) {
    return { error: "기안 제목과 내용을 모두 입력해 주세요." };
  }

  if (formData.type === "EXPENSE" && (!formData.amount || formData.amount <= 0)) {
    return { error: "지출 결의서의 경우 지출 요청 금액을 0원보다 크게 입력해 주세요." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // Fetch applicant name
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const applicantName = profile?.name || "기안자";

  const initialSteps: ApprovalStepItem[] = formData.steps.map((st) => ({
    step: st.step,
    name: st.name,
    role: st.role,
    status: "PENDING",
  }));

  const { data: newApproval, error } = await supabase
    .from("approvals")
    .insert({
      organization_id: membership.organizationId,
      title: formData.title.trim(),
      type: formData.type,
      amount: formData.amount || null,
      content: formData.content.trim(),
      applicant_id: user.id,
      department_id: formData.department_id || null,
      project_id: formData.project_id || null,
      status: "PENDING",
      current_step: 1,
      total_steps: initialSteps.length,
      steps: initialSteps as unknown as Database["public"]["Tables"]["approvals"]["Insert"]["steps"],
    })
    .select("id")
    .single();

  if (error || !newApproval) {
    return { error: "기안서 등록 실패: " + (error?.message ?? "") };
  }

  // Record log
  await supabase.from("approval_logs").insert({
    organization_id: membership.organizationId,
    approval_id: newApproval.id,
    actor_id: user.id,
    actor_name: applicantName,
    action: "SUBMIT",
    comment: "기안 상신 완료",
  });

  revalidatePath("/approvals");
  return { error: null, success: true };
}

export async function approveApprovalStep(
  approvalId: string,
  comment?: string,
  syncToLedger?: boolean
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const approverName = profile?.name || "결재권자";

  // Fetch current approval
  const { data: current, error: fetchErr } = await supabase
    .from("approvals")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .eq("id", approvalId)
    .single();

  if (fetchErr || !current) {
    return { error: "결재 문서를 찾을 수 없습니다." };
  }

  if (current.status !== "PENDING") {
    return { error: "이미 처리가 완료되었거나 반려된 문서입니다." };
  }

  const currentStepNum = current.current_step;
  const totalSteps = current.total_steps;
  const steps = (current.steps as unknown as ApprovalStepItem[]) || [];

  const updatedSteps = steps.map((st) => {
    if (st.step === currentStepNum) {
      return {
        ...st,
        status: "APPROVED" as const,
        approver_id: user.id,
        approver_name: approverName,
        comment: comment?.trim() || null,
        decided_at: new Date().toISOString(),
      };
    }
    return st;
  });

  const isFinalStep = currentStepNum >= totalSteps;
  const nextStatus = isFinalStep ? "APPROVED" : "PENDING";
  const nextStepNum = isFinalStep ? currentStepNum : currentStepNum + 1;

  const { error: updateErr } = await supabase
    .from("approvals")
    .update({
      status: nextStatus,
      current_step: nextStepNum,
      steps: updatedSteps as unknown as Database["public"]["Tables"]["approvals"]["Update"]["steps"],
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", approvalId);

  if (updateErr) {
    return { error: "결재 승인 처리 실패: " + updateErr.message };
  }

  // Log action
  await supabase.from("approval_logs").insert({
    organization_id: membership.organizationId,
    approval_id: approvalId,
    actor_id: user.id,
    actor_name: approverName,
    action: isFinalStep ? "FINAL_APPROVE" : "APPROVE_STEP",
    comment: comment?.trim() || (isFinalStep ? "최종 승인 완료" : `${currentStepNum}단계 승인`),
  });

  // If final approval on EXPENSE and syncToLedger is true, insert into budgets
  if (isFinalStep && current.type === "EXPENSE" && (current.amount || 0) > 0 && syncToLedger) {
    await supabase.from("budgets").insert({
      organization_id: membership.organizationId,
      title: `[결재완료 지출] ${current.title}`,
      type: "EXPENSE",
      planned_amount: Number(current.amount),
      actual_amount: Number(current.amount),
      department_id: current.department_id || null,
      project_id: current.project_id || null,
      transaction_date: new Date().toISOString().split("T")[0],
    });
    revalidatePath("/finance");
  }

  if (current.applicant_id) {
    await supabase.from("notifications").insert({
      organization_id: membership.organizationId,
      user_id: current.applicant_id,
      title: isFinalStep ? "결재 최종 승인" : `결재 ${currentStepNum}단계 승인`,
      message: `[${current.title}] 결재 문서가 ${isFinalStep ? "최종 승인되었습니다." : `${currentStepNum}단계 승인되었습니다.`}`,
      type: "APPROVAL",
      link_url: "/approvals",
    });
  }

  revalidatePath("/approvals");
  return { error: null, success: true };
}

export async function rejectApproval(
  approvalId: string,
  rejectReason: string
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  if (!rejectReason.trim()) {
    return { error: "반려 사유를 필수로 입력해 주세요." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const approverName = profile?.name || "결재권자";

  const { data: current } = await supabase
    .from("approvals")
    .select("title, applicant_id")
    .eq("organization_id", membership.organizationId)
    .eq("id", approvalId)
    .single();

  const { error: updateErr } = await supabase
    .from("approvals")
    .update({
      status: "REJECTED",
      reject_reason: rejectReason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", approvalId);

  if (updateErr) {
    return { error: "반려 처리 실패: " + updateErr.message };
  }

  // Log rejection
  await supabase.from("approval_logs").insert({
    organization_id: membership.organizationId,
    approval_id: approvalId,
    actor_id: user.id,
    actor_name: approverName,
    action: "REJECT",
    comment: rejectReason.trim(),
  });

  if (current?.applicant_id) {
    await supabase.from("notifications").insert({
      organization_id: membership.organizationId,
      user_id: current.applicant_id,
      title: "결재 문서 반려",
      message: `[${current.title}] 결재 문서가 반려되었습니다: ${rejectReason.trim()}`,
      type: "WARNING",
      link_url: "/approvals",
    });
  }

  revalidatePath("/approvals");
  return { error: null, success: true };
}

export async function deleteApproval(approvalId: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("approvals")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", approvalId);

  if (error) {
    return { error: "기안 문서 삭제 실패: " + error.message };
  }

  revalidatePath("/approvals");
  return { error: null, success: true };
}

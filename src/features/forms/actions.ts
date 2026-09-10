"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type EventFormRow = Database["public"]["Tables"]["event_forms"]["Row"];
export type FormSubmissionRow = Database["public"]["Tables"]["form_submissions"]["Row"];

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface EventFormWithStats extends EventFormRow {
  totalSubmissions: number;
  approvedCount: number;
  pendingCount: number;
  checkedInCount: number;
  projects?: { id: string; name: string } | null;
}

export type ActionState = {
  error: string | null;
  success?: boolean;
  ticketCode?: string;
};

// Helper: generate formatted ticket code (e.g. TKT-2026-A8K2)
function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `TKT-${year}-${code}`;
}

// ---------------------------------------------------------------------------
// Internal Admin Queries & Actions
// ---------------------------------------------------------------------------

export async function getEventForms(
  statusFilter?: "ALL" | "OPEN" | "CLOSED" | "DRAFT",
  categoryFilter?: string,
): Promise<EventFormWithStats[]> {
  if (!getSupabaseConfig()) return [];

  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();

  let query = supabase
    .from("event_forms")
    .select("*, projects(id, name), form_submissions(id, status, checked_in)")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }

  if (categoryFilter && categoryFilter !== "ALL") {
    query = query.eq("category", categoryFilter as "BOOTH" | "TICKET" | "GENERAL");
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((form) => {
    const submissions = (form.form_submissions ?? []) as Array<{ id: string; status: string; checked_in: boolean }>;
    const totalSubmissions = submissions.length;
    const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
    const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
    const checkedInCount = submissions.filter((s) => s.checked_in).length;

    return {
      ...form,
      totalSubmissions,
      approvedCount,
      pendingCount,
      checkedInCount,
    } as EventFormWithStats;
  });
}

export async function getEventFormDetail(formId: string): Promise<{
  form: EventFormWithStats | null;
  submissions: FormSubmissionRow[];
  projects: Array<{ id: string; name: string }>;
}> {
  if (!getSupabaseConfig()) return { form: null, submissions: [], projects: [] };

  const membership = await getCurrentUserOrganization();
  if (!membership) return { form: null, submissions: [], projects: [] };

  const supabase = await createClient();

  // 1. Fetch form
  const { data: formData, error: formError } = await supabase
    .from("event_forms")
    .select("*, projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .eq("id", formId)
    .single();

  if (formError || !formData) {
    return { form: null, submissions: [], projects: [] };
  }

  // 2. Fetch submissions
  const { data: submissionsData } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  const submissions = (submissionsData ?? []) as FormSubmissionRow[];

  // 3. Fetch available projects for dropdown
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", membership.organizationId)
    .order("name");

  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const checkedInCount = submissions.filter((s) => s.checked_in).length;

  const formWithStats: EventFormWithStats = {
    ...formData,
    totalSubmissions,
    approvedCount,
    pendingCount,
    checkedInCount,
  };

  return {
    form: formWithStats,
    submissions,
    projects: projectsData ?? [],
  };
}

export async function createEventForm(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const title = formData.get("title");
  const description = (formData.get("description") as string) || "";
  const category = (formData.get("category") as string) || "BOOTH";
  const status = (formData.get("status") as string) || "OPEN";
  const projectId = formData.get("project_id") as string | null;
  const startAt = formData.get("start_at") as string | null;
  const endAt = formData.get("end_at") as string | null;
  const maxCapacityRaw = formData.get("max_capacity") as string | null;
  const customFieldsRaw = formData.get("custom_fields") as string | null;

  if (typeof title !== "string" || !title.trim()) {
    return { error: "신청 폼 제목을 입력해 주세요." };
  }

  let maxCapacity: number | null = null;
  if (maxCapacityRaw && maxCapacityRaw.trim()) {
    const parsed = parseInt(maxCapacityRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      maxCapacity = parsed;
    }
  }

  let customFields: CustomField[] = [];
  if (customFieldsRaw) {
    try {
      customFields = JSON.parse(customFieldsRaw);
    } catch {
      customFields = [];
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("event_forms").insert({
    organization_id: membership.organizationId,
    title: title.trim(),
    description: description.trim(),
    category: category as "BOOTH" | "TICKET" | "GENERAL",
    status: status as "DRAFT" | "OPEN" | "CLOSED",
    project_id: projectId || null,
    start_at: startAt ? new Date(startAt).toISOString() : null,
    end_at: endAt ? new Date(endAt).toISOString() : null,
    max_capacity: maxCapacity,
    custom_fields: customFields as unknown as Database["public"]["Tables"]["event_forms"]["Insert"]["custom_fields"],
  });

  if (error) {
    return { error: "신청 폼 생성에 실패했습니다: " + error.message };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}

export async function updateEventForm(
  formId: string,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const title = formData.get("title");
  const description = (formData.get("description") as string) || "";
  const category = (formData.get("category") as string) || "BOOTH";
  const status = formData.get("status") as string | null;
  const projectId = formData.get("project_id") as string | null;
  const startAt = formData.get("start_at") as string | null;
  const endAt = formData.get("end_at") as string | null;
  const maxCapacityRaw = formData.get("max_capacity") as string | null;

  if (typeof title !== "string" || !title.trim()) {
    return { error: "신청 폼 제목을 입력해 주세요." };
  }

  let maxCapacity: number | null = null;
  if (maxCapacityRaw && maxCapacityRaw.trim()) {
    const parsed = parseInt(maxCapacityRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      maxCapacity = parsed;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_forms")
    .update({
      title: title.trim(),
      description: description.trim(),
      category: category as "BOOTH" | "TICKET" | "GENERAL",
      ...(status ? { status: status as "DRAFT" | "OPEN" | "CLOSED" } : {}),
      project_id: projectId || null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      max_capacity: maxCapacity,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", formId);

  if (error) {
    return { error: "신청 폼 수정에 실패했습니다: " + error.message };
  }

  revalidatePath("/forms");
  revalidatePath(`/forms/${formId}`);
  return { error: null, success: true };
}

export async function deleteEventForm(formId: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_forms")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", formId);

  if (error) {
    return { error: "신청 폼 삭제에 실패했습니다: " + error.message };
  }

  revalidatePath("/forms");
  return { error: null, success: true };
}

export async function updateSubmissionStatus(
  submissionId: string,
  formId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
  rejectionReason?: string,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("form_submissions")
    .update({
      status,
      rejection_reason: rejectionReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", submissionId);

  if (error) {
    return { error: "신청서 상태 변경 실패: " + error.message };
  }

  revalidatePath(`/forms/${formId}`);
  return { error: null, success: true };
}

export async function toggleSubmissionCheckIn(
  submissionId: string,
  formId: string,
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  // Get current check-in state
  const { data: current } = await supabase
    .from("form_submissions")
    .select("checked_in")
    .eq("organization_id", membership.organizationId)
    .eq("id", submissionId)
    .single();

  if (!current) {
    return { error: "신청서를 찾을 수 없습니다." };
  }

  const nextCheckedIn = !current.checked_in;
  const { error } = await supabase
    .from("form_submissions")
    .update({
      checked_in: nextCheckedIn,
      checked_in_at: nextCheckedIn ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", submissionId);

  if (error) {
    return { error: "체크인 처리에 실패했습니다: " + error.message };
  }

  revalidatePath(`/forms/${formId}`);
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// Public Participant Queries & Actions (Accessible without login)
// ---------------------------------------------------------------------------

export async function getPublicEventForm(formId: string): Promise<{
  form: (EventFormRow & { organizations: { name: string; university_name: string } }) | null;
  currentSubmissionsCount: number;
  isAvailable: boolean;
}> {
  if (!getSupabaseConfig()) {
    return { form: null, currentSubmissionsCount: 0, isAvailable: false };
  }

  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("event_forms")
    .select("*, organizations(name, university_name)")
    .eq("id", formId)
    .eq("status", "OPEN")
    .maybeSingle();

  if (error || !form) {
    return { form: null, currentSubmissionsCount: 0, isAvailable: false };
  }

  // Count current approved/pending submissions
  const { count } = await supabase
    .from("form_submissions")
    .select("*", { count: "exact", head: true })
    .eq("form_id", formId)
    .in("status", ["PENDING", "APPROVED"]);

  const currentSubmissionsCount = count ?? 0;
  const now = new Date();
  const isTimeValid =
    (!form.start_at || new Date(form.start_at) <= now) &&
    (!form.end_at || new Date(form.end_at) >= now);

  const isCapacityValid =
    form.max_capacity === null || currentSubmissionsCount < form.max_capacity;

  const isAvailable = isTimeValid && isCapacityValid;

  return {
    form: form as unknown as EventFormRow & { organizations: { name: string; university_name: string } },
    currentSubmissionsCount,
    isAvailable,
  };
}

export async function submitPublicApplication(
  formId: string,
  formData: FormData,
): Promise<ActionState> {
  const applicantName = formData.get("applicant_name");
  const applicantPhone = formData.get("applicant_phone");
  const applicantEmail = formData.get("applicant_email") as string | null;
  const applicantStudentId = formData.get("applicant_student_id") as string | null;
  const applicantDepartment = formData.get("applicant_department") as string | null;
  const groupName = formData.get("group_name") as string | null;
  const responsesRaw = formData.get("responses") as string | null;

  if (typeof applicantName !== "string" || !applicantName.trim()) {
    return { error: "신청자 이름을 입력해 주세요." };
  }
  if (typeof applicantPhone !== "string" || !applicantPhone.trim()) {
    return { error: "연락처를 입력해 주세요." };
  }

  let responses: Record<string, unknown> = {};
  if (responsesRaw) {
    try {
      responses = JSON.parse(responsesRaw);
    } catch {
      responses = {};
    }
  }

  const supabase = await createClient();

  // 1. Verify form is open
  const { data: form, error: formError } = await supabase
    .from("event_forms")
    .select("id, organization_id, status, max_capacity, start_at, end_at")
    .eq("id", formId)
    .eq("status", "OPEN")
    .maybeSingle();

  if (formError || !form) {
    return { error: "현재 신청이 불가능하거나 마감된 폼입니다." };
  }

  // Check deadline
  const now = new Date();
  if (form.end_at && new Date(form.end_at) < now) {
    return { error: "신청 기간이 마감되었습니다." };
  }
  if (form.start_at && new Date(form.start_at) > now) {
    return { error: "아직 신청 기간이 아닙니다." };
  }

  // Check capacity if specified
  if (form.max_capacity) {
    const { count } = await supabase
      .from("form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("form_id", formId)
      .in("status", ["PENDING", "APPROVED"]);

    if ((count ?? 0) >= form.max_capacity) {
      return { error: "모집 정원이 마감되었습니다." };
    }
  }

  // Generate unique ticket code
  const ticketCode = generateTicketCode();

  // Insert submission
  const { error: insertError } = await supabase.from("form_submissions").insert({
    organization_id: form.organization_id,
    form_id: formId,
    applicant_name: applicantName.trim(),
    applicant_phone: applicantPhone.trim(),
    applicant_email: applicantEmail?.trim() || null,
    applicant_student_id: applicantStudentId?.trim() || null,
    applicant_department: applicantDepartment?.trim() || null,
    group_name: groupName?.trim() || null,
    status: "PENDING",
    ticket_code: ticketCode,
    responses: responses as unknown as Database["public"]["Tables"]["form_submissions"]["Insert"]["responses"],
  });

  if (insertError) {
    return { error: "신청서 제출에 실패했습니다: " + insertError.message };
  }

  revalidatePath(`/forms/${formId}`);
  return { error: null, success: true, ticketCode };
}

export async function getPublicTicket(
  ticketCode: string,
  phone?: string,
): Promise<{ submission: FormSubmissionRow | null; formTitle?: string }> {
  if (!getSupabaseConfig() || !ticketCode.trim()) {
    return { submission: null };
  }

  const supabase = await createClient();

  let query = supabase
    .from("form_submissions")
    .select("*, event_forms(title)")
    .eq("ticket_code", ticketCode.trim().toUpperCase());

  if (phone && phone.trim()) {
    query = query.eq("applicant_phone", phone.trim());
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return { submission: null };

  const formTitle = (data.event_forms as { title: string } | null)?.title;
  return {
    submission: data as unknown as FormSubmissionRow,
    formTitle,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error: string | null;
  success?: boolean;
};

// ---------------------------------------------------------------------------
// 1. Organization Creation Requests (By regular user)
// ---------------------------------------------------------------------------

export async function requestCreateOrganization(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orgName = formData.get("org_name");
  const universityName = formData.get("university_name");
  const reason = (formData.get("reason") as string) || "";

  if (typeof orgName !== "string" || !orgName.trim()) {
    return { error: "학생회(조직) 이름을 입력해 주세요." };
  }
  if (typeof universityName !== "string" || !universityName.trim()) {
    return { error: "대학교 이름을 입력해 주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Check if user already has an active pending creation request
  const { data: existing } = await supabase
    .from("organization_creation_requests")
    .select("id")
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "이미 심사 중인 조직 생성 신청이 있습니다." };
  }

  const { error } = await supabase.from("organization_creation_requests").insert({
    requester_id: user.id,
    org_name: orgName.trim(),
    university_name: universityName.trim(),
    reason: reason.trim(),
    status: "pending",
  });

  if (error) {
    return { error: "조직 생성 신청 중 오류가 발생했습니다. 다시 시도해 주세요." };
  }

  redirect("/onboarding?status=creation_requested");
}

// ---------------------------------------------------------------------------
// 2. Organization Join Requests (By regular user)
// ---------------------------------------------------------------------------

export async function requestJoinOrganization(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizationId = formData.get("organization_id");
  const message = (formData.get("message") as string) || "";

  if (typeof organizationId !== "string" || !organizationId.trim()) {
    return { error: "가입할 조직을 선택해 주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Check if already a member of this organization
  const { data: alreadyMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (alreadyMember) {
    return { error: "이미 해당 조직의 구성원입니다." };
  }

  // Check if already requested join and pending
  const { data: existingRequest } = await supabase
    .from("organization_join_requests")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingRequest) {
    return { error: "이미 해당 조직에 가입 신청을 보냈습니다. 승인을 기다려 주세요." };
  }

  const { error } = await supabase.from("organization_join_requests").insert({
    organization_id: organizationId,
    requester_id: user.id,
    message: message.trim(),
    status: "pending",
  });

  if (error) {
    return { error: "가입 신청 중 오류가 발생했습니다. 다시 시도해 주세요." };
  }

  redirect("/onboarding?status=join_requested");
}

// ---------------------------------------------------------------------------
// 3. Site Admin Operations: Approve / Reject Organization Creation
// ---------------------------------------------------------------------------

export async function approveOrganizationCreation(requestId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증되지 않은 요청입니다." };
  }

  // Verify site admin privilege
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_site_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_site_admin) {
    return { error: "사이트 운영자만 조직 생성을 승인할 수 있습니다." };
  }

  // Fetch creation request
  const { data: req, error: reqError } = await supabase
    .from("organization_creation_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (reqError || !req) {
    return { error: "승인 대기 중인 신청을 찾을 수 없습니다." };
  }

  // 1. Create Organization
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: req.org_name,
      university_name: req.university_name,
    })
    .select()
    .single();

  if (orgError || !newOrg) {
    return { error: "조직 생성에 실패했습니다: " + (orgError?.message ?? "") };
  }

  // 2. Assign requester as PRESIDENT
  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: newOrg.id,
    user_id: req.requester_id,
    role: "PRESIDENT",
  });

  if (memberError) {
    return { error: "조직 대표 등록에 실패했습니다: " + memberError.message };
  }

  // 3. Mark request as approved
  await supabase
    .from("organization_creation_requests")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/admin");
  return { error: null, success: true };
}

export async function rejectOrganizationCreation(requestId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증되지 않은 요청입니다." };
  }

  // Verify site admin privilege
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_site_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_site_admin) {
    return { error: "사이트 운영자만 조직 신청을 거부할 수 있습니다." };
  }

  const { error } = await supabase
    .from("organization_creation_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    return { error: "신청 거부 처리 중 오류가 발생했습니다." };
  }

  revalidatePath("/admin");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// 4. Org Admin Operations: Approve / Reject Member Join Request
// ---------------------------------------------------------------------------

export async function approveJoinRequest(requestId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증되지 않은 요청입니다." };
  }

  // Fetch join request
  const { data: req, error: reqError } = await supabase
    .from("organization_join_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (reqError || !req) {
    return { error: "대기 중인 가입 신청을 찾을 수 없습니다." };
  }

  // Verify current user is ADMIN+ in that organization
  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", req.organization_id)
    .eq("user_id", user.id)
    .single();

  if (!member || !["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(member.role)) {
    return { error: "해당 학생회의 관리자만 가입을 승인할 수 있습니다." };
  }

  // 1. Add user as member
  const { error: insertMemberError } = await supabase.from("organization_members").insert({
    organization_id: req.organization_id,
    user_id: req.requester_id,
    role: "MEMBER",
  });

  if (insertMemberError) {
    return { error: "회원 등록에 실패했습니다: " + insertMemberError.message };
  }

  // 2. Mark request approved
  await supabase
    .from("organization_join_requests")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function rejectJoinRequest(requestId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증되지 않은 요청입니다." };
  }

  const { data: req } = await supabase
    .from("organization_join_requests")
    .select("organization_id")
    .eq("id", requestId)
    .single();

  if (!req) {
    return { error: "가입 신청을 찾을 수 없습니다." };
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", req.organization_id)
    .eq("user_id", user.id)
    .single();

  if (!member || !["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(member.role)) {
    return { error: "해당 학생회의 관리자만 가입을 거부할 수 있습니다." };
  }

  await supabase
    .from("organization_join_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// 5. Query Helpers for UI Pages
// ---------------------------------------------------------------------------

export async function isCurrentUserSiteAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_site_admin")
    .eq("id", user.id)
    .maybeSingle();

  return !!profile?.is_site_admin;
}

export async function getMyRequests() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { creationRequests: [], joinRequests: [] };

  const [creationRes, joinRes] = await Promise.all([
    supabase
      .from("organization_creation_requests")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_join_requests")
      .select("*, organizations(name, university_name)")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    creationRequests: creationRes.data ?? [],
    joinRequests: joinRes.data ?? [],
  };
}

export async function searchOrganizations(query?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("organizations")
    .select("id, name, university_name")
    .order("name", { ascending: true })
    .limit(50);

  if (query && query.trim()) {
    q = q.or(`name.ilike.%${query.trim()}%,university_name.ilike.%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export async function getPendingCreationRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_creation_requests")
    .select("*, profiles:requester_id(name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

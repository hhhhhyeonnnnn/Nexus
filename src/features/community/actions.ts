"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
export type PetitionRow = Database["public"]["Tables"]["petitions"]["Row"];
export type PollRow = Database["public"]["Tables"]["polls"]["Row"];
export type PollVoteRow = Database["public"]["Tables"]["poll_votes"]["Row"];

export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
}

export type ActionState = {
  error: string | null;
  success?: boolean;
};

// ---------------------------------------------------------------------------
// Announcements (공지사항 관리)
// ---------------------------------------------------------------------------

export async function getAnnouncements(categoryFilter?: string): Promise<AnnouncementRow[]> {
  if (!getSupabaseConfig()) return [];
  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  let query = supabase
    .from("announcements")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoryFilter && categoryFilter !== "ALL") {
    query = query.eq("category", categoryFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("공지사항 목록 조회 오류:", error);
    return [];
  }
  return data ?? [];
}

export async function createAnnouncement(formData: {
  title: string;
  content: string;
  category: "GENERAL" | "ACADEMIC" | "EVENT" | "FINANCE";
  is_pinned?: boolean;
  is_public?: boolean;
}): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  if (!formData.title?.trim() || !formData.content?.trim()) {
    return { error: "제목과 본문을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("announcements").insert({
    organization_id: membership.organizationId,
    title: formData.title.trim(),
    content: formData.content.trim(),
    category: formData.category || "GENERAL",
    is_pinned: formData.is_pinned ?? false,
    is_public: formData.is_public ?? true,
    author_id: user?.id ?? null,
  });

  if (error) {
    return { error: "공지사항 등록 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

export async function updateAnnouncement(
  id: string,
  formData: {
    title?: string;
    content?: string;
    category?: "GENERAL" | "ACADEMIC" | "EVENT" | "FINANCE";
    is_pinned?: boolean;
    is_public?: boolean;
  }
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", id);

  if (error) {
    return { error: "공지사항 수정 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

export async function deleteAnnouncement(id: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", id);

  if (error) {
    return { error: "공지사항 삭제 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// Petitions (학생 건의함 관리)
// ---------------------------------------------------------------------------

export async function getPetitions(statusFilter?: string): Promise<PetitionRow[]> {
  if (!getSupabaseConfig()) return [];
  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  let query = supabase
    .from("petitions")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("건의함 목록 조회 오류:", error);
    return [];
  }
  return data ?? [];
}

export async function answerPetition(
  id: string,
  officialAnswer: string,
  status: "PENDING" | "IN_REVIEW" | "ANSWERED" | "REJECTED" = "ANSWERED"
): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  if (!officialAnswer.trim()) {
    return { error: "답변 내용을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("petitions")
    .update({
      official_answer: officialAnswer.trim(),
      status,
      answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", id);

  if (error) {
    return { error: "답변 저장 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

export async function deletePetition(id: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("petitions")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", id);

  if (error) {
    return { error: "건의사항 삭제 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// Polls (캠퍼스 투표 관리)
// ---------------------------------------------------------------------------

export async function getPolls(): Promise<PollRow[]> {
  if (!getSupabaseConfig()) return [];
  const membership = await getCurrentUserOrganization();
  if (!membership) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("투표 목록 조회 오류:", error);
    return [];
  }
  return data ?? [];
}

export async function createPoll(formData: {
  title: string;
  description?: string;
  options: string[];
  expires_at?: string;
}): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  if (!formData.title?.trim()) {
    return { error: "투표 안건 제목을 입력해 주세요." };
  }

  const validOptions = formData.options
    .map((opt) => opt.trim())
    .filter(Boolean);

  if (validOptions.length < 2) {
    return { error: "선택지를 최소 2개 이상 입력해 주세요." };
  }

  const pollOptions: PollOption[] = validOptions.map((text, idx) => ({
    id: `opt_${idx + 1}_${Math.random().toString(36).substring(2, 7)}`,
    text,
    vote_count: 0,
  }));

  const supabase = await createClient();
  const { error } = await supabase.from("polls").insert({
    organization_id: membership.organizationId,
    title: formData.title.trim(),
    description: formData.description?.trim() ?? "",
    options: pollOptions as unknown as Database["public"]["Tables"]["polls"]["Insert"]["options"],
    expires_at: formData.expires_at || null,
    is_closed: false,
    total_votes: 0,
  });

  if (error) {
    return { error: "투표 생성 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

export async function closePoll(pollId: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("polls")
    .update({ is_closed: true })
    .eq("organization_id", membership.organizationId)
    .eq("id", pollId);

  if (error) {
    return { error: "투표 마감 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

export async function deletePoll(pollId: string): Promise<ActionState> {
  const membership = await getCurrentUserOrganization();
  if (!membership) return { error: "조직 권한이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", pollId);

  if (error) {
    return { error: "투표 삭제 실패: " + error.message };
  }

  revalidatePath("/community");
  revalidatePath("/feed");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// Public Feed & External Student Queries & Actions (Accessible without login)
// ---------------------------------------------------------------------------

export async function getPublicFeed(orgId?: string): Promise<{
  organization: { id: string; name: string; university_name: string } | null;
  announcements: AnnouncementRow[];
  petitions: PetitionRow[];
  polls: PollRow[];
}> {
  if (!getSupabaseConfig()) {
    return { organization: null, announcements: [], petitions: [], polls: [] };
  }

  const supabase = await createClient();

  // Find target organization
  let organizationQuery = supabase
    .from("organizations")
    .select("id, name, university_name");

  if (orgId) {
    organizationQuery = organizationQuery.eq("id", orgId);
  } else {
    organizationQuery = organizationQuery.limit(1);
  }

  const { data: orgs } = await organizationQuery;
  const currentOrg = orgs && orgs.length > 0 ? orgs[0] : null;

  if (!currentOrg) {
    return { organization: null, announcements: [], petitions: [], polls: [] };
  }

  const [announcementsRes, petitionsRes, pollsRes] = await Promise.all([
    supabase
      .from("announcements")
      .select("*")
      .eq("organization_id", currentOrg.id)
      .eq("is_public", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("petitions")
      .select("*")
      .eq("organization_id", currentOrg.id)
      .eq("is_secret", false)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("polls")
      .select("*")
      .eq("organization_id", currentOrg.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    organization: currentOrg,
    announcements: announcementsRes.data ?? [],
    petitions: petitionsRes.data ?? [],
    polls: pollsRes.data ?? [],
  };
}

export async function submitPublicPetition(data: {
  organization_id: string;
  title: string;
  content: string;
  author_name?: string;
  student_id?: string;
  is_secret?: boolean;
}): Promise<ActionState> {
  if (!data.title?.trim() || !data.content?.trim()) {
    return { error: "제목과 건의 내용을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("petitions").insert({
    organization_id: data.organization_id,
    title: data.title.trim(),
    content: data.content.trim(),
    author_name: data.author_name?.trim() || "익명 학우",
    student_id: data.student_id?.trim() || null,
    is_secret: data.is_secret ?? false,
    status: "PENDING",
  });

  if (error) {
    return { error: "건의 등록 실패: " + error.message };
  }

  revalidatePath("/feed");
  revalidatePath("/community");
  return { error: null, success: true };
}

export async function votePublicPoll(
  pollId: string,
  organizationId: string,
  voterIdentifier: string,
  optionId: string
): Promise<ActionState> {
  if (!voterIdentifier?.trim() || !optionId?.trim()) {
    return { error: "투표 정보가 올바르지 않습니다." };
  }

  const supabase = await createClient();

  // 1. Fetch current poll to check if open
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .eq("organization_id", organizationId)
    .single();

  if (pollError || !poll) {
    return { error: "투표를 찾을 수 없습니다." };
  }

  if (poll.is_closed) {
    return { error: "이미 마감된 투표입니다." };
  }

  // 2. Insert vote
  const { error: voteError } = await supabase.from("poll_votes").insert({
    organization_id: organizationId,
    poll_id: pollId,
    voter_identifier: voterIdentifier.trim(),
    selected_option_id: optionId.trim(),
  });

  if (voteError) {
    if (voteError.code === "23505") {
      return { error: "이미 이 투표에 참여하셨습니다." };
    }
    return { error: "투표 처리 실패: " + voteError.message };
  }

  // 3. Update vote count in poll options
  const options = (poll.options as unknown as PollOption[]) || [];
  const updatedOptions = options.map((opt) => {
    if (opt.id === optionId) {
      return { ...opt, vote_count: (opt.vote_count || 0) + 1 };
    }
    return opt;
  });

  await supabase
    .from("polls")
    .update({
      options: updatedOptions as unknown as Database["public"]["Tables"]["polls"]["Update"]["options"],
      total_votes: (poll.total_votes || 0) + 1,
    })
    .eq("id", pollId);

  revalidatePath("/feed");
  revalidatePath("/community");
  return { error: null, success: true };
}

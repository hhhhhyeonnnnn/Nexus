"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import {
  askNexusAssistant,
  type AssistantAnswer,
  type AssistantChatMessage,
} from "@/lib/ai/assistant";

export type AssistantActionResult =
  | { success: true; data: AssistantAnswer; error?: never }
  | { success: false; error: string; data?: never };

export async function askAssistantAction(
  question: string,
  history: AssistantChatMessage[] = []
): Promise<AssistantActionResult> {
  if (!getSupabaseConfig()) {
    return { success: false, error: "데이터베이스 연결 설정이 올바르지 않습니다." };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { success: false, error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  if (!question || !question.trim()) {
    return { success: false, error: "질문 내용을 입력해 주세요." };
  }

  const supabase = await createClient();
  const res = await askNexusAssistant({
    supabase,
    organizationId: membership.organizationId,
    question: question.trim(),
    history,
  });

  return res;
}

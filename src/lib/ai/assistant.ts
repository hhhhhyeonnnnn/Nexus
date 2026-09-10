import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const AssistantAnswerSchema = z.object({
  answer: z.string().min(1, "응답 내용이 비어있습니다."),
  keyPoints: z.array(z.string()).default([]),
  suggestedActions: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
      })
    )
    .default([]),
});

export type AssistantAnswer = z.infer<typeof AssistantAnswerSchema>;

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantInput {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  question: string;
  history?: AssistantChatMessage[];
}

export type AssistantResponse =
  | { success: true; data: AssistantAnswer; error?: never }
  | { success: false; error: string; data?: never };

interface OrganizationContext {
  organizationName: string;
  budget: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    recentItems: Array<{ title: string; type: string; amount: number; hasReceipt: boolean }>;
  };
  projects: Array<{ id: string; name: string; status: string; dates: string }>;
  tasks: Array<{ id: string; title: string; status: string; dueDate: string | null; assignee: string | null }>;
  meetings: Array<{ id: string; title: string; date: string; summary?: string | null }>;
  decisions: Array<{ id: string; title: string; content: string }>;
  approvals: Array<{ id: string; title: string; type: string; amount: number | null; status: string; applicant: string | null }>;
  departments: Array<{ name: string; description: string | null }>;
  announcements: Array<{ title: string; date: string }>;
}

async function gatherOrganizationContext(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<OrganizationContext> {
  const [
    orgRes,
    budgetsRes,
    projectsRes,
    tasksRes,
    meetingsRes,
    decisionsRes,
    approvalsRes,
    deptRes,
    announcementsRes,
    membersRes,
  ] = await Promise.all([
    supabase.from("organizations").select("name, university_name").eq("id", organizationId).maybeSingle(),
    supabase
      .from("budgets")
      .select("title, type, planned_amount, actual_amount, receipt_url, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("projects")
      .select("id, name, status, start_date, end_date")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, assignee_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("meetings")
      .select("id, title, meeting_date, ai_summary")
      .eq("organization_id", organizationId)
      .order("meeting_date", { ascending: false })
      .limit(10),
    supabase
      .from("decisions")
      .select("id, title, content")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("approvals")
      .select("id, title, type, amount, status, profiles(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("departments")
      .select("name, description")
      .eq("organization_id", organizationId),
    supabase
      .from("announcements")
      .select("title, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("organization_members")
      .select("user_id, profiles(name)")
      .eq("organization_id", organizationId),
  ]);

  const memberNameMap = new Map<string, string>();
  for (const m of membersRes.data ?? []) {
    const pName = (m.profiles as { name: string | null } | null)?.name;
    if (pName) {
      memberNameMap.set(m.user_id, pName);
    }
  }

  const budgetItems = budgetsRes.data ?? [];
  let totalIncome = 0;
  let totalExpense = 0;
  for (const b of budgetItems) {
    const amount = Number(b.actual_amount || b.planned_amount || 0);
    if (b.type === "INCOME") totalIncome += amount;
    else if (b.type === "EXPENSE") totalExpense += amount;
  }

  return {
    organizationName: orgRes.data?.name ?? "학생회",
    budget: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      recentItems: budgetItems.slice(0, 8).map((b) => ({
        title: b.title,
        type: b.type,
        amount: Number(b.actual_amount || b.planned_amount || 0),
        hasReceipt: Boolean(b.receipt_url),
      })),
    },
    projects: (projectsRes.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      dates: [p.start_date, p.end_date].filter(Boolean).join(" ~ "),
    })),
    tasks: (tasksRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.due_date,
      assignee: t.assignee_id ? memberNameMap.get(t.assignee_id) ?? null : null,
    })),
    meetings: (meetingsRes.data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      date: m.meeting_date,
      summary: m.ai_summary,
    })),
    decisions: (decisionsRes.data ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
    })),
    approvals: (approvalsRes.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      amount: a.amount ? Number(a.amount) : null,
      status: a.status,
      applicant: (a.profiles as { name: string | null } | null)?.name ?? null,
    })),
    departments: (deptRes.data ?? []).map((d) => ({
      name: d.name,
      description: d.description,
    })),
    announcements: (announcementsRes.data ?? []).map((a) => ({
      title: a.title,
      date: a.created_at,
    })),
  };
}

function generateLocalFallbackAnswer(question: string, ctx: OrganizationContext): AssistantAnswer {
  const q = question.toLowerCase();

  // 1. Budget / Finance inquiry
  if (q.includes("예산") || q.includes("잔액") || q.includes("지출") || q.includes("수입") || q.includes("돈") || q.includes("회계")) {
    const formattedBal = ctx.budget.balance.toLocaleString("ko-KR");
    const formattedInc = ctx.budget.totalIncome.toLocaleString("ko-KR");
    const formattedExp = ctx.budget.totalExpense.toLocaleString("ko-KR");
    return {
      answer: `현재 ${ctx.organizationName}의 총 수입은 ${formattedInc}원, 총 지출은 ${formattedExp}원이며, 현재 잔액은 **${formattedBal}원**입니다.\n\n최근 기록된 회계 내역:\n${ctx.budget.recentItems.length > 0 ? ctx.budget.recentItems.slice(0, 3).map((b) => `• ${b.title} (${b.type === "INCOME" ? "수입" : "지출"} ${b.amount.toLocaleString()}원${b.hasReceipt ? ", 영수증 첨부" : ", 영수증 미첨부"})`).join("\n") : "등록된 내역이 없습니다."}`,
      keyPoints: [
        `현재 잔액: ${formattedBal}원`,
        `총 지출: ${formattedExp}원 / 총 수입: ${formattedInc}원`,
        `최근 내역 수: ${ctx.budget.recentItems.length}건`,
      ],
      suggestedActions: [
        { label: "회계 장부 상세 보기", href: "/finance" },
        { label: "결재함 확인하기", href: "/approvals" },
      ],
    };
  }

  // 2. Task / Work inquiry
  if (q.includes("업무") || q.includes("할 일") || q.includes("마감") || q.includes("태스크") || q.includes("담당자")) {
    const urgent = ctx.tasks.filter((t) => t.status !== "DONE" && t.dueDate);
    const unassigned = ctx.tasks.filter((t) => !t.assignee && t.status !== "DONE");
    return {
      answer: `현재 총 ${ctx.tasks.length}개의 업무가 등록되어 있습니다.\n\n• 미배정 업무: ${unassigned.length}건\n• 기한이 지정된 진행 업무: ${urgent.length}건\n\n주요 업무 목록:\n${ctx.tasks.slice(0, 4).map((t) => `• [${t.status}] ${t.title} (담당: ${t.assignee ?? "미배정"}${t.dueDate ? `, 마감: ${t.dueDate}` : ""})`).join("\n")}`,
      keyPoints: [
        `전체 업무: ${ctx.tasks.length}건`,
        `미배정 업무: ${unassigned.length}건`,
      ],
      suggestedActions: [
        { label: "전체 업무 관리 보기", href: "/tasks" },
        { label: "프로젝트 확인하기", href: "/projects" },
      ],
    };
  }

  // 3. Meeting / Decision inquiry
  if (q.includes("회의") || q.includes("결정") || q.includes("의결") || q.includes("회의록")) {
    return {
      answer: `최근 등록된 회의는 ${ctx.meetings.length}건, 의결된 주요 결정사항은 ${ctx.decisions.length}건입니다.\n\n주요 결정사항:\n${ctx.decisions.length > 0 ? ctx.decisions.slice(0, 3).map((d) => `• **${d.title}**: ${d.content}`).join("\n") : "등록된 결정사항이 없습니다."}`,
      keyPoints: [
        `최근 회의: ${ctx.meetings.length}건`,
        `결정사항: ${ctx.decisions.length}건`,
      ],
      suggestedActions: [
        { label: "회의록 및 결정사항 보기", href: "/meetings" },
      ],
    };
  }

  // 4. Approval inquiry
  if (q.includes("결재") || q.includes("승인") || q.includes("기안") || q.includes("서류")) {
    const pending = ctx.approvals.filter((a) => a.status === "PENDING");
    return {
      answer: `현재 결재함에는 총 ${ctx.approvals.length}건의 문서가 있으며, 이 중 **${pending.length}건**이 승인 대기 중입니다.\n\n${pending.length > 0 ? pending.slice(0, 3).map((p) => `• [${p.type}] ${p.title} (기안자: ${p.applicant ?? "미상"}${p.amount ? `, ${p.amount.toLocaleString()}원` : ""})`).join("\n") : "현재 대기 중인 결재가 없습니다."}`,
      keyPoints: [
        `승인 대기 문서: ${pending.length}건`,
        `전체 결재 문서: ${ctx.approvals.length}건`,
      ],
      suggestedActions: [
        { label: "전자결재함 바로가기", href: "/approvals" },
      ],
    };
  }

  // Default general response
  return {
    answer: `안녕하세요! **${ctx.organizationName}**의 전담 AI 어시스턴트 Nexus AI입니다.\n\n현재 우리 학생회 운영 현황:\n• 프로젝트: ${ctx.projects.length}개 진행 중\n• 등록 업무: ${ctx.tasks.length}개\n• 결재 문서: 대기 ${ctx.approvals.filter((a) => a.status === "PENDING").length}건\n• 회계 잔액: ${ctx.budget.balance.toLocaleString("ko-KR")}원\n\n궁금한 예산, 업무, 회의 결정사항, 결재 서류 등에 대해 무엇이든 질문해 주세요!`,
    keyPoints: [
      `학생회: ${ctx.organizationName}`,
      `진행 프로젝트: ${ctx.projects.length}개`,
      `현재 잔액: ${ctx.budget.balance.toLocaleString("ko-KR")}원`,
    ],
    suggestedActions: [
      { label: "대시보드로 이동", href: "/dashboard" },
      { label: "회계 장부 보기", href: "/finance" },
      { label: "업무 관리 보기", href: "/tasks" },
    ],
  };
}

export async function askNexusAssistant({
  supabase,
  organizationId,
  question,
  history = [],
}: AssistantInput): Promise<AssistantResponse> {
  try {
    const context = await gatherOrganizationContext(supabase, organizationId);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallback = generateLocalFallbackAnswer(question, context);
      return { success: true, data: fallback };
    }

    const systemPrompt = `당신은 대학 학생회 전용 운영체제인 'Nexus'의 지능형 총괄 비서(Nexus AI)입니다.
학생회 구성원들이 예산, 업무 현황, 회의 결정사항, 프로젝트 진척도, 결재 대기 서류 등을 질문했을 때, 아래에 제공된 실시간 학생회 운영 데이터를 기반으로 정확하고 친절하며 신뢰할 수 있게 답변하세요.

[원칙]
1. 반드시 아래의 [학생회 실시간 운영 데이터]에 근거하여 사실만을 답변하세요.
2. 데이터에 없는 사실, 금액, 담당자, 날짜는 절대 지어내지 말고 "데이터상 확인되지 않는다"고 명확히 안내하세요.
3. 답변은 읽기 편한 한국어 마크다운으로 구성하고, 관련 핵심 요약(keyPoints)과 사용자가 바로 이동하여 확인할 수 있는 추천 액션(suggestedActions)을 JSON으로 반환하세요.
4. suggestedActions의 href는 다음 경로 중 관련된 곳을 연결하세요:
   - /dashboard, /projects, /tasks, /calendar, /meetings, /finance, /vendors, /members, /forms, /approvals, /community

[학생회 실시간 운영 데이터]:
- 학생회명: ${context.organizationName}
- 부서 목록: ${context.departments.map((d) => d.name).join(", ") || "없음"}
- 회계 현황: 총 수입 ${context.budget.totalIncome.toLocaleString()}원, 총 지출 ${context.budget.totalExpense.toLocaleString()}원, 현재 잔액 ${context.budget.balance.toLocaleString()}원
  최근 항목: ${JSON.stringify(context.budget.recentItems)}
- 프로젝트: ${JSON.stringify(context.projects)}
- 등록 업무: ${JSON.stringify(context.tasks)}
- 최근 회의: ${JSON.stringify(context.meetings)}
- 의결 결정사항: ${JSON.stringify(context.decisions)}
- 결재 문서: ${JSON.stringify(context.approvals)}
- 공지사항: ${JSON.stringify(context.announcements)}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "answer": "질문에 대한 상세하고 명확한 마크다운 답변",
  "keyPoints": ["핵심 요약 1", "핵심 요약 2"],
  "suggestedActions": [
    {"label": "이동할 화면 명칭", "href": "/경로"}
  ]
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const fallback = generateLocalFallbackAnswer(question, context);
      return { success: true, data: fallback };
    }

    const payload = await response.json();
    const rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) {
      const fallback = generateLocalFallbackAnswer(question, context);
      return { success: true, data: fallback };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const fallback = generateLocalFallbackAnswer(question, context);
      return { success: true, data: fallback };
    }

    const parseResult = AssistantAnswerSchema.safeParse(parsed);
    if (!parseResult.success) {
      const fallback = generateLocalFallbackAnswer(question, context);
      return { success: true, data: fallback };
    }

    return { success: true, data: parseResult.data };
  } catch {
    try {
      const context = await gatherOrganizationContext(supabase, organizationId);
      const fallback = generateLocalFallbackAnswer(question, context);
      return { success: true, data: fallback };
    } catch (innerErr) {
      const msg = innerErr instanceof Error ? innerErr.message : "AI 어시스턴트 처리 중 오류가 발생했습니다.";
      return { success: false, error: msg };
    }
  }
}

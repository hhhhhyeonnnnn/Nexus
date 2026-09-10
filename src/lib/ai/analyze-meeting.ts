import "server-only";
import { z } from "zod";

export const MeetingTaskCandidateSchema = z.object({
  title: z.string().min(1, "태스크 제목은 필수입니다."),
  description: z.string().default(""),
  suggestedDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
    .nullable()
    .default(null),
  suggestedAssigneeName: z.string().nullable().default(null),
});

export const MeetingDecisionCandidateSchema = z.object({
  title: z.string().min(1, "결정사항 제목은 필수입니다."),
  content: z.string().min(1, "결정 내용은 필수입니다."),
  reason: z.string().default(""),
});

export const MeetingAnalysisResultSchema = z.object({
  summary: z.string().min(1, "요약 내용이 비어있습니다."),
  tasks: z.array(MeetingTaskCandidateSchema).default([]),
  decisions: z.array(MeetingDecisionCandidateSchema).default([]),
});

export type MeetingAnalysisResult = z.infer<typeof MeetingAnalysisResultSchema>;
export type MeetingTaskCandidate = z.infer<typeof MeetingTaskCandidateSchema>;
export type MeetingDecisionCandidate = z.infer<typeof MeetingDecisionCandidateSchema>;

export interface AnalyzeMeetingInput {
  title: string;
  content: string;
  attendees?: string | null;
  projectName?: string | null;
}

export type AnalyzeMeetingResponse =
  | { success: true; data: MeetingAnalysisResult; error?: never }
  | { success: false; error: string; data?: never };

const SYSTEM_PROMPT = `당신은 대학 학생회 전용 운영체제인 'Nexus'의 AI 회의록 분석 비서입니다.
제공된 학생회 회의록의 제목, 참석자, 본문 내용을 엄밀하게 분석하여 JSON 객체로 반환하세요.

반드시 지켜야 할 원칙:
1. **사실에 근거**: 회의록 본문에 언급되지 않은 내용, 담당자, 날짜를 절대 추측하거나 임의로 지어내지 마세요.
2. **담당자 추측 금지**: 특정 업무의 담당자가 본문에서 명시적으로 지정되지 않은 경우, 'suggestedAssigneeName'은 반드시 null로 설정하세요.
3. **마감일 추측 금지**: 기한이나 마감일이 명시적으로 나오지 않은 경우, 'suggestedDueDate'는 반드시 null로 설정하세요. 마감일이 명시된 경우 반드시 'YYYY-MM-DD' 형식으로 표기하세요 (연도가 없으면 회의 일자 기준 연도 적용).
4. **결정사항(Decisions)**: 회의에서 가결되거나 합의·확정된 중요 의결 사항을 추출하세요. 배경/사유(reason)가 본문에 있다면 포함하고 없으면 빈 문자열로 두세요.
5. **할 일(Tasks)**: 실행해야 할 후속 액션 아이템을 실행 가능한 단위로 구체화하여 추출하세요.
6. **안건 요약(summary)**: 논의된 주요 안건과 결과를 간결하고 명확한 마크다운 불릿 포인트(•) 형식의 한국어로 요약하세요.

반드시 다음 JSON 스키마를 엄격히 준수하는 단일 JSON 객체만 출력하세요:
{
  "summary": "마크다운 형식의 안건별 요약 문자열",
  "tasks": [
    {
      "title": "업무 제목",
      "description": "업무 상세 설명 및 맥락",
      "suggestedDueDate": "YYYY-MM-DD 또는 null",
      "suggestedAssigneeName": "담당자 이름 또는 null"
    }
  ],
  "decisions": [
    {
      "title": "결정사항 제목",
      "content": "구체적인 의결/확정 내용",
      "reason": "결정 배경 및 이유"
    }
  ]
}`;

export async function analyzeMeetingWithAI(
  input: AnalyzeMeetingInput,
): Promise<AnalyzeMeetingResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      success: false,
      error:
        "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local에 OpenAI API 키를 등록하거나 배포 환경 변수에 추가해 주세요.",
    };
  }

  const promptContent = `[회의 제목]: ${input.title}
${input.projectName ? `[연관 프로젝트]: ${input.projectName}\n` : ""}${
    input.attendees ? `[참석자]: ${input.attendees}\n` : ""
  }
[회의 내용 및 기록]:
${input.content}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptContent },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `OpenAI API 오류 (HTTP ${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMsg = `OpenAI 오류: ${errorJson.error.message}`;
        }
      } catch {
        // use default error message
      }
      return { success: false, error: errorMsg };
    }

    const payload = await response.json();
    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      return { success: false, error: "OpenAI로부터 응답 본문을 받지 못했습니다." };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      return { success: false, error: "AI 응답을 JSON으로 파싱하지 못했습니다." };
    }

    const parseResult = MeetingAnalysisResultSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      const validationIssues = parseResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return {
        success: false,
        error: `AI 응답 스키마 검증 실패: ${validationIssues}`,
      };
    }

    return {
      success: true,
      data: parseResult.data,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return {
        success: false,
        error: "AI 분석 요청 시간이 초과되었습니다 (45초). 잠시 후 다시 시도해 주세요.",
      };
    }
    const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
    return {
      success: false,
      error: `AI 분석 처리 중 오류가 발생했습니다: ${message}`,
    };
  }
}

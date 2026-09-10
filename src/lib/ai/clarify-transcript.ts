import "server-only";
import { z } from "zod";

export const ClarificationItemSchema = z.object({
  id: z.string(),
  originalSnippet: z.string().min(1, "원문 구절은 필수입니다."),
  suggestedCorrection: z.string().min(1, "교정 제안은 필수입니다."),
  detectedIssue: z.string().min(1, "오류 감지 사유는 필수입니다."),
  contextSnippet: z.string().default(""),
});

export const TranscriptClarificationResultSchema = z.object({
  clarifications: z.array(ClarificationItemSchema).default([]),
  overallSummary: z.string().default("전사문 검토 완료"),
});

export type ClarificationItem = z.infer<typeof ClarificationItemSchema>;
export type TranscriptClarificationResult = z.infer<
  typeof TranscriptClarificationResultSchema
>;

export interface ClarifyTranscriptInput {
  transcript: string;
  meetingTitle?: string;
  projectName?: string | null;
  departments?: string[];
  members?: string[];
}

export type ClarifyTranscriptResponse =
  | { success: true; data: TranscriptClarificationResult; error?: never }
  | { success: false; error: string; data?: never };

const SYSTEM_PROMPT = `당신은 대한민국 대학 학생회 전문 AI 음성인식(STT) 전사 교정 비서입니다.
실시간 마이크를 통해 받아적은 학생회 회의 발언 녹취록(Transcript)에서, 음성인식 엔진(STT) 특성상 발음 유사성으로 인해 잘못 받아적혔거나 문맥상 왜곡된 단어 및 문장을 정밀하게 찾아내어 교정안을 제시해야 합니다.

주요 검토 기준:
1. **발음 유사어 및 학생회 특화 약어 오인식 교정**:
   - 예: "라인너비" ➔ "라인업" (축제/공연 문맥)
   - 예: "단운이" ➔ "단운위" (단과대학운영위원회)
   - 예: "전학대" / "정학대회" ➔ "전학대회" (전체학생대표자회의)
   - 예: "총학" / "과대" / "부대" / "과방" / "학생회관" 등 대학 고유 표현
   - 제공된 학생회 부서명, 직책명, 프로젝트명, 참석자 명단을 적극 참조하여 고유명사 오인식을 바로잡으세요.
2. **숫자 및 금액/단위 문맥 오류**:
   - 금액 단위(만 원, 천 원) 누락이나 비상식적인 오타 탐지.
3. **불필요한 과도 교정 금지**:
   - 일상 구어체 표현이나 정상적으로 말한 발언은 억지로 문어체로 바꾸지 마세요.
   - 명백한 음성인식 오류, 학생회 용어 왜곡, 문맥상 비문/오탈자만 교정 대상으로 지정하세요.
   - 교정할 부분이 없거나 전사 품질이 훌륭하다면 clarifications 배열을 빈 배열([])로 반환하세요.

반드시 다음 JSON 스키마를 엄격히 준수하는 단일 JSON 객체만 출력하세요:
{
  "clarifications": [
    {
      "id": "1",
      "originalSnippet": "음성인식된 잘못된 단어 또는 어구",
      "suggestedCorrection": "AI가 제안하는 올바른 단어 또는 어구",
      "detectedIssue": "의심 사유 (예: 축제 연예인 섭외 문맥 상 '라인업'의 발음 오인식으로 추정)",
      "contextSnippet": "해당 단어가 포함된 앞뒤 문장 문맥"
    }
  ],
  "overallSummary": "전사 상태 요약 (예: '축제 기획 관련 전문 용어 3건의 발음 오인식을 감지했습니다.')"
}`;

export async function clarifyTranscriptWithAI(
  input: ClarifyTranscriptInput,
): Promise<ClarifyTranscriptResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      success: false,
      error:
        "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local에 OpenAI API 키를 등록하거나 배포 환경 변수에 추가해 주세요.",
    };
  }

  if (!input.transcript || !input.transcript.trim()) {
    return {
      success: false,
      error: "검토할 음성 전사 텍스트가 비어있습니다.",
    };
  }

  const contextItems: string[] = [];
  if (input.meetingTitle) contextItems.push(`[회의 제목]: ${input.meetingTitle}`);
  if (input.projectName) contextItems.push(`[연관 프로젝트]: ${input.projectName}`);
  if (input.departments && input.departments.length > 0) {
    contextItems.push(`[학생회 부서 목록]: ${input.departments.join(", ")}`);
  }
  if (input.members && input.members.length > 0) {
    contextItems.push(`[학생회 구성원 명단]: ${input.members.join(", ")}`);
  }

  const promptContent = `${contextItems.join("\n")}

[음성인식 전사 원문]:
${input.transcript.trim()}

위 음성 전사문에서 음성인식 발음 오류나 학생회 용어 오인식을 감지하여 JSON 형식으로 교정안을 제시해 주세요.`;

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
      signal: AbortSignal.timeout(30_000),
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

    const parseResult = TranscriptClarificationResultSchema.safeParse(parsedJson);
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
        error: "AI 문맥 검토 요청 시간이 초과되었습니다 (30초). 잠시 후 다시 시도해 주세요.",
      };
    }
    const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
    return {
      success: false,
      error: `AI 문맥 교정 처리 중 오류가 발생했습니다: ${message}`,
    };
  }
}

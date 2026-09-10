import "server-only";
import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z.string().min(1, "품목명은 필수입니다."),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().int().nonnegative().default(0),
  totalPrice: z.number().int().nonnegative().default(0),
});

export const ReceiptOcrResultSchema = z.object({
  storeName: z.string().default("미상"),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
    .default(() => new Date().toISOString().slice(0, 10)),
  totalAmount: z.number().int().nonnegative().default(0),
  paymentMethod: z.string().default("카드"),
  approvalNumber: z.string().nullable().default(null),
  summaryTitle: z.string().min(1, "항목명은 필수입니다."),
  suggestedCategory: z.string().default("비품·운영비"),
  suggestedVendorId: z.string().nullable().default(null),
  suggestedDepartmentId: z.string().nullable().default(null),
  suggestedProjectId: z.string().nullable().default(null),
  items: z.array(ReceiptItemSchema).default([]),
  confidenceNote: z.string().default(""),
});

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ReceiptOcrResult = z.infer<typeof ReceiptOcrResultSchema>;

export interface AnalyzeReceiptInput {
  imageBase64: string;
  mimeType?: string;
  vendors?: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string }>;
}

export type AnalyzeReceiptResponse =
  | { success: true; data: ReceiptOcrResult; error?: never }
  | { success: false; error: string; data?: never };

const SYSTEM_PROMPT = `당신은 대학 학생회 전용 운영체제 'Nexus'의 영수증 OCR 및 회계 지출 결의서 작성 비서입니다.
사용자가 제출한 영수증(종이 영수증, 신용카드 전표, 현금영수증, 전자영수증, 계산서 등) 이미지를 정밀하게 판독하여 지출 결의서에 필요한 정보를 JSON 형태로 추출하세요.

[분석 및 추출 규칙]
1. **가맹점명 (storeName)**: 영수증 상단 상호명 또는 사업자 상호. (예: "다이소 신촌본점", "이마트24", "알파문구")
2. **거래 일자 (transactionDate)**: 결제 일자를 'YYYY-MM-DD' 형식으로 표기. 연도가 두 자리(예: 26/09/10)인 경우 2026년 기준으로 변환.
3. **총 결제 금액 (totalAmount)**: 부가세(VAT) 포함 최종 결제 합계 금액 (원 단위 정수).
4. **결제 수단 (paymentMethod)**: '신용카드', '체크카드', '현금', '계좌이체' 중 하나.
5. **승인번호 (approvalNumber)**: 카드 승인번호 또는 영수증 고유 관리번호가 보이면 추출, 없으면 null.
6. **지출 결의서 항목명 추천 (summaryTitle)**: 상호명과 주요 품목을 조합하여 직관적인 학생회 회계 지출 제목 작성 (예: "축제 부스 데코용 소품 구매 (다이소)", "간식행사 음료 50캔 구매 (이마트24)").
7. **추천 카테고리 (suggestedCategory)**:
   - 다음 중 가장 적합한 하나를 선택: ["학생회비", "행사·축제비", "홍보·인쇄비", "복지·간식비", "비품·운영비", "제휴·후원금", "기타"]
8. **등록된 학생회 메타데이터 매칭**:
   - 거래처 매칭: 제공된 등록 거래처 목록 중 가맹점명과 유사한 것이 있다면 해당 거래처의 ID를 'suggestedVendorId'에 넣고, 없으면 null.
   - 부서 매칭: 품목 성격(예: 홍보물 -> 홍보디자인국, 간식 -> 복지국, 사업/행사 -> 기획국, 회계/총무 -> 사무재정국)에 가장 적합한 부서 ID를 'suggestedDepartmentId'에 넣고, 없으면 null.
   - 프로젝트 매칭: 영수증 내용이 특정 프로젝트(예: 대동제, 신입생OT)와 연관되어 보이면 해당 프로젝트 ID를 'suggestedProjectId'에 넣고, 불명확하면 null.
9. **구매 품목 상세 (items)**: 영수증에 인쇄된 품목명, 수량, 단가, 총금액 리스트를 추출. (품목이 명시되지 않은 단순 카드전표인 경우 단일 품목으로 합계 금액을 기재).
10. **분석 신뢰도 비고 (confidenceNote)**: 영수증 판독 상태, 불명확한 부분, 사용자가 확인해야 할 사항을 한국어 한 줄로 작성 (예: "결제 금액과 일자가 선명하게 인식되었습니다.", "품목 세부명이 인쇄되지 않아 합계 금액 기준으로 작성되었습니다.").

반드시 아래 JSON 스키마를 만족하는 유효한 JSON 객체 하나만 출력하세요:
{
  "storeName": "상호명",
  "transactionDate": "YYYY-MM-DD",
  "totalAmount": 12500,
  "paymentMethod": "신용카드",
  "approvalNumber": "12345678",
  "summaryTitle": "추천 지출 항목명",
  "suggestedCategory": "비품·운영비",
  "suggestedVendorId": "UUID or null",
  "suggestedDepartmentId": "UUID or null",
  "suggestedProjectId": "UUID or null",
  "items": [
    {
      "name": "품목명",
      "quantity": 1,
      "unitPrice": 5000,
      "totalPrice": 5000
    }
  ],
  "confidenceNote": "인식 안내 비고"
}`;

export async function analyzeReceiptOcr(
  input: AnalyzeReceiptInput,
): Promise<AnalyzeReceiptResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "OPENAI_API_KEY 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.",
    };
  }

  const mimeType = input.mimeType || "image/jpeg";
  // Strip data:image/...;base64, prefix if present
  let cleanBase64 = input.imageBase64;
  const commaIndex = cleanBase64.indexOf(",");
  if (commaIndex !== -1) {
    cleanBase64 = cleanBase64.slice(commaIndex + 1);
  }

  const vendorsContext = (input.vendors ?? [])
    .map((v) => `- ID: ${v.id}, 상호명: ${v.name}`)
    .join("\n");

  const departmentsContext = (input.departments ?? [])
    .map((d) => `- ID: ${d.id}, 부서명: ${d.name}`)
    .join("\n");

  const projectsContext = (input.projects ?? [])
    .map((p) => `- ID: ${p.id}, 프로젝트명: ${p.name}`)
    .join("\n");

  const userPrompt = `다음은 현재 학생회에 등록된 데이터 컨텍스트입니다.
[등록된 제휴/거래처 목록]:
${vendorsContext || "(등록된 거래처 없음)"}

[등록된 집행 부서 목록]:
${departmentsContext || "(등록된 부서 없음)"}

[진행 중인 프로젝트 목록]:
${projectsContext || "(진행 중인 프로젝트 없음)"}

위 컨텍스트를 참고하여, 첨부된 영수증 이미지를 정밀 분석하여 JSON 객체로 반환해 주세요.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${cleanBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[ReceiptOCR] OpenAI API Error:", response.status, errorBody);
      return {
        success: false,
        error: `Vision AI 분석 호출에 실패했습니다 (HTTP ${response.status}).`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: "AI 모델로부터 응답 내용을 수신하지 못했습니다.",
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      return {
        success: false,
        error: "AI 응답을 JSON으로 파싱할 수 없습니다.",
      };
    }

    const parseResult = ReceiptOcrResultSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      console.error("[ReceiptOCR] Zod Validation Failed:", parseResult.error.format());
      return {
        success: false,
        error: "AI 출력 형식이 규격에 맞지 않습니다: " + parseResult.error.message,
      };
    }

    return {
      success: true,
      data: parseResult.data,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return {
        success: false,
        error: "영수증 분석 시간이 초과되었습니다 (30초 제한). 다시 시도해 주세요.",
      };
    }
    console.error("[ReceiptOCR] Unexpected Error:", err);
    return {
      success: false,
      error: "영수증 분석 중 예상치 못한 오류가 발생했습니다.",
    };
  }
}

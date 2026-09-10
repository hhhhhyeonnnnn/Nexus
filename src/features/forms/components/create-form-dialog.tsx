"use client";

import { useState, useTransition } from "react";
import { Plus, X, Trash2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEventForm, type CustomField } from "@/features/forms/actions";

export function CreateFormDialog({
  projects,
}: {
  projects: Array<{ id: string; name: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"BOOTH" | "TICKET" | "GENERAL">("BOOTH");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Helpers to add custom questions
  const addField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    };
    setCustomFields([...customFields, newField]);
  };

  const removeField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  // Student Council presets
  const applyBoothPreset = () => {
    setCategory("BOOTH");
    setCustomFields([
      {
        id: "booth_type",
        label: "부스 유형 (먹거리 / 게임체험 / 플리마켓 / 전시·홍보)",
        type: "select",
        required: true,
        options: ["먹거리 주점/간식", "게임/체험 부스", "플리마켓/굿즈 판매", "동아리 홍보/전시", "기타"],
      },
      {
        id: "power_usage",
        label: "전력 필요량 (예: 1kW 미만, 냉장고/튀김기 등 전기기기 목록)",
        type: "text",
        required: true,
        placeholder: "예: 인덕션 1구 (2kW), 조명용 콘센트 1구",
      },
      {
        id: "fire_usage",
        label: "화기(가스버너 등) 사용 여부",
        type: "select",
        required: true,
        options: ["미사용 (전기 기기만 사용)", "사용 (부탄가스 버너 1대 이하)", "사용 (대용량 가구 화기)", "해당 없음"],
      },
      {
        id: "water_usage",
        label: "수도/급수 시설 필요 여부",
        type: "select",
        required: true,
        options: ["불필요", "필요 (조리/세척용)"],
      },
    ]);
  };

  const applyTicketPreset = () => {
    setCategory("TICKET");
    setCustomFields([
      {
        id: "ticket_qty",
        label: "신청 수량 (1인당 최대 2매)",
        type: "select",
        required: true,
        options: ["1매", "2매"],
      },
      {
        id: "entry_session",
        label: "희망 입장 회차/타임",
        type: "select",
        required: true,
        options: ["1회차 (13:00 ~ 15:00)", "2회차 (15:30 ~ 17:30)", "3회차 (18:00 ~ 20:00)"],
      },
      {
        id: "student_status",
        label: "학생 신분 (재학 / 휴학 / 졸업생 / 외부인)",
        type: "select",
        required: true,
        options: ["학부 재학생", "학부 휴학생", "대학원생", "외부 일반인"],
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("category", category);
    formData.set("custom_fields", JSON.stringify(customFields));

    startTransition(async () => {
      const res = await createEventForm({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setError(null);
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError(null);
          setCategory("BOOTH");
          setCustomFields([]);
          setIsOpen(true);
        }}
        className="gap-2 text-xs font-medium"
      >
        <Plus className="size-4" aria-hidden="true" />
        <span>새 신청 폼 만들기</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
              <div>
                <h2 className="text-base font-semibold text-foreground">새 행사/부스 신청 폼 개설</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  외부 학생 및 동아리가 참가할 수 있는 공개 신청 페이지를 생성합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-accent/20 border-b text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3.5 text-primary" />
                추천 프리셋 바로 불러오기:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyBoothPreset}
                  className="rounded px-2.5 py-1 text-xs font-medium bg-background border hover:border-primary hover:text-primary transition-colors"
                >
                  🎪 축제 부스/주점 폼
                </button>
                <button
                  type="button"
                  onClick={applyTicketPreset}
                  className="rounded px-2.5 py-1 text-xs font-medium bg-background border hover:border-primary hover:text-primary transition-colors"
                >
                  🎫 티켓/입장권 예매 폼
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
                  {error}
                </div>
              )}

              {/* Form Title */}
              <div className="space-y-1.5">
                <Label htmlFor="form-title" className="text-xs font-semibold">
                  신청 폼 제목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="form-title"
                  name="title"
                  placeholder="예: 2026 봄 대동제 동아리/학과 부스 및 주점 신청"
                  required
                  className="text-sm"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-category" className="text-xs font-semibold">
                    신청 유형
                  </Label>
                  <select
                    id="form-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "BOOTH" | "TICKET" | "GENERAL")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="BOOTH">부스 / 주점 신청 (동아리, 학과)</option>
                    <option value="TICKET">티켓 / 참가권 예매</option>
                    <option value="GENERAL">일반 설문 및 참가 신청</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-status" className="text-xs font-semibold">
                    초기 공개 상태
                  </Label>
                  <select
                    id="form-status"
                    name="status"
                    defaultValue="OPEN"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="OPEN">🟢 모집 중 (즉시 공개)</option>
                    <option value="DRAFT">🟡 작성 중 (비공개 보관)</option>
                  </select>
                </div>
              </div>

              {/* Project association & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-project" className="text-xs font-semibold">
                    연관 프로젝트 (선택)
                  </Label>
                  <select
                    id="form-project"
                    name="project_id"
                    defaultValue=""
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">연관 프로젝트 없음</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="form-capacity" className="text-xs font-semibold">
                    모집 정원 / 최대 수량 (선택)
                  </Label>
                  <Input
                    id="form-capacity"
                    name="max_capacity"
                    type="number"
                    min="1"
                    placeholder="비워두면 무제한 접수"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Date ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-start-at" className="text-xs font-semibold">
                    신청 시작 일시 (선택)
                  </Label>
                  <Input
                    id="form-start-at"
                    name="start_at"
                    type="datetime-local"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="form-end-at" className="text-xs font-semibold">
                    신청 마감 일시 (선택)
                  </Label>
                  <Input
                    id="form-end-at"
                    name="end_at"
                    type="datetime-local"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="form-desc" className="text-xs font-semibold">
                  안내 사항 및 설명
                </Label>
                <textarea
                  id="form-desc"
                  name="description"
                  rows={3}
                  placeholder="행사 장소, 운영 수칙, 보증금 입금 안내 등 신청자에게 공지할 내용을 작성해 주세요."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Custom Questions Section */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      맞춤 질문 필드 ({customFields.length}개)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      기본 정보(이름, 연락처, 학번, 학과, 단체명) 외에 추가로 받을 질문을 등록합니다.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    className="text-xs gap-1 h-7.5"
                  >
                    <Plus className="size-3.5" />
                    질문 추가
                  </Button>
                </div>

                {customFields.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    추가된 맞춤 질문이 없습니다. 상단의 &apos;질문 추가&apos; 또는 프리셋을 이용해 보세요.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="rounded-lg border bg-muted/10 p-3.5 space-y-2.5 relative group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            질문 #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                            title="질문 삭제"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-2 space-y-1">
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              placeholder="질문 내용을 입력하세요 (예: 전기 콘센트 사용 수)"
                              required
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateField(field.id, {
                                  type: e.target.value as CustomField["type"],
                                  ...(e.target.value === "select" && !field.options
                                    ? { options: ["옵션 1", "옵션 2"] }
                                    : {}),
                                })
                              }
                              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs"
                            >
                              <option value="text">단답형 텍스트</option>
                              <option value="textarea">장문형 설명</option>
                              <option value="select">객관식 단일 선택</option>
                              <option value="number">숫자 입력</option>
                            </select>
                          </div>
                        </div>

                        {/* If select, manage options */}
                        {field.type === "select" && (
                          <div className="space-y-1 pt-1">
                            <Label className="text-[10px] text-muted-foreground">
                              선택지 목록 (쉼표로 구분하여 입력)
                            </Label>
                            <Input
                              value={(field.options ?? []).join(", ")}
                              onChange={(e) =>
                                updateField(field.id, {
                                  options: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="예: 1매, 2매 또는 부탄가스 미사용, 1대 사용"
                              className="text-xs h-7.5"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`req_${field.id}`}
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="rounded border-input text-primary focus:ring-primary size-3.5"
                          />
                          <Label htmlFor={`req_${field.id}`} className="text-xs font-normal cursor-pointer text-muted-foreground">
                            필수 답변 항목
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "생성 중..." : "신청 폼 개설하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Ticket,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitPublicApplication,
  getPublicTicket,
  type CustomField,
  type FormSubmissionRow,
} from "@/features/forms/actions";
import { useRealtimeSubscription } from "@/lib/supabase/realtime";
import { PrivacyConsentModal } from "@/components/common/privacy-consent-modal";

export function PublicApplicationForm({
  formId,
  formTitle,
  formDescription,
  category,
  maxCapacity,
  currentCount,
  endAt,
  customFields,
  orgName,
  universityName,
}: {
  formId: string;
  formTitle: string;
  formDescription: string;
  category: "BOOTH" | "TICKET" | "GENERAL";
  maxCapacity: number | null;
  currentCount: number;
  endAt: string | null;
  customFields: CustomField[];
  orgName: string;
  universityName: string;
}) {
  const [mode, setMode] = useState<"APPLY" | "SUCCESS" | "LOOKUP">("APPLY");
  const [issuedTicketCode, setIssuedTicketCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Live count with Realtime (derived without effect)
  const [additionalCount, setAdditionalCount] = useState(0);

  useRealtimeSubscription<{ id: string; form_id: string }>({
    table: "form_submissions",
    filter: `form_id=eq.${formId}`,
    onInsert: () => {
      setAdditionalCount((prev) => prev + 1);
    },
  });

  const liveCount = currentCount + additionalCount;

  // Custom field values state
  const [customResponses, setCustomResponses] = useState<Record<string, unknown>>({});

  // Privacy Consent Modal state
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);

  // Ticket lookup state
  const [lookupCode, setLookupCode] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupResult, setLookupResult] = useState<FormSubmissionRow | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const isFull = maxCapacity !== null && liveCount >= maxCapacity;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isConsentChecked) {
      setError("개인정보 수집 및 이용에 동의하셔야 신청이 완료됩니다.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("responses", JSON.stringify(customResponses));

    startTransition(async () => {
      const res = await submitPublicApplication(formId, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.ticketCode) {
        setError(null);
        setIssuedTicketCode(res.ticketCode);
        setMode("SUCCESS");
      }
    });
  };

  const [shared, setShared] = useState(false);

  const handleCopyTicket = () => {
    if (issuedTicketCode && navigator.clipboard) {
      navigator.clipboard.writeText(issuedTicketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareEvent = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `[${formTitle}] 신청 완료!`,
          text: `「${formTitle}」 함께 가실 분? 지금 접수 중입니다!`,
          url: shareUrl,
        });
        return;
      } catch {
        // Share cancelled
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;

    startTransition(async () => {
      const { submission } = await getPublicTicket(lookupCode, lookupPhone || undefined);
      if (!submission) {
        setLookupError("입력하신 티켓 코드와 일치하는 신청 내역을 찾을 수 없습니다.");
        setLookupResult(null);
      } else {
        setLookupError(null);
        setLookupResult(submission);
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Top Switcher: Apply vs Lookup */}
      <div className="flex items-center justify-between border-b pb-3 text-xs">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("APPLY");
              setError(null);
            }}
            className={`font-semibold pb-1 border-b-2 transition-colors ${
              mode === "APPLY" || mode === "SUCCESS"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            참가 / 부스 신청서 작성
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("LOOKUP");
              setError(null);
            }}
            className={`font-semibold pb-1 border-b-2 transition-colors ${
              mode === "LOOKUP"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            내 티켓 / 접수 내역 조회
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground">
          {universityName} {orgName}
        </span>
      </div>

      {/* Mode 1: Success Screen after Submission */}
      {mode === "SUCCESS" && issuedTicketCode && (
        <div className="rounded-2xl border bg-card p-6 md:p-8 text-center space-y-6 shadow-lg animate-in zoom-in-95">
          <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">신청이 정상 접수되었습니다!</h2>
            <p className="text-xs text-muted-foreground">
              학생회 담당자의 심사 후 승인 결과가 확정됩니다. 아래 티켓 번호를 꼭 보관해 주세요.
            </p>
          </div>

          {/* Ticket Display Card */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-primary/5 border-2 border-primary/30 space-y-4 text-left shadow-xs">
            <div className="flex items-center justify-between border-b border-primary/20 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Official Admission Ticket
                </span>
                <p className="text-sm font-bold text-foreground line-clamp-1">{formTitle}</p>
              </div>
              <Ticket className="size-6 text-primary shrink-0" />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">발급된 고유 접수/티켓 번호</span>
              <div className="flex items-center justify-between gap-2 bg-background p-3 rounded-lg border">
                <span className="font-mono text-lg font-bold text-primary tracking-wider">
                  {issuedTicketCode}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyTicket}
                  className="h-8 text-xs gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-muted-foreground" />
                      <span>복사</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary shrink-0" />
              <span>행사 당일 현장 입장 데스크에서 이 번호를 제시하시면 빠른 입장이 가능합니다.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleShareEvent}
              className="w-full sm:w-auto text-xs gap-1.5 font-semibold"
            >
              {shared ? (
                <>
                  <Check className="size-3.5 text-emerald-300" />
                  <span>링크 복사됨!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5" />
                  <span>친구에게 이 행사 공유하기</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLookupCode(issuedTicketCode);
                setMode("LOOKUP");
              }}
              className="w-full sm:w-auto text-xs"
            >
              내 신청 상태 바로 확인하기
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIssuedTicketCode(null);
                setMode("APPLY");
              }}
              className="w-full sm:w-auto text-xs text-muted-foreground"
            >
              새 신청서 추가 작성
            </Button>
          </div>
        </div>
      )}

      {/* Mode 2: Ticket Lookup Screen */}
      {mode === "LOOKUP" && (
        <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-6 shadow-sm">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-foreground">내 티켓 / 접수 내역 조회</h2>
            <p className="text-xs text-muted-foreground">
              신청 시 발급받으신 티켓 코드(예: TKT-2026-XXXX)를 입력하세요.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            {lookupError && (
              <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium">
                {lookupError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="lookup-code" className="text-xs font-semibold">
                티켓 번호 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lookup-code"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                placeholder="TKT-2026-XXXX"
                required
                className="font-mono text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lookup-phone" className="text-xs font-semibold">
                신청자 연락처 (선택 확인용)
              </Label>
              <Input
                id="lookup-phone"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="text-sm"
              />
            </div>

            <Button type="submit" className="w-full text-xs font-semibold h-9" disabled={isPending}>
              {isPending ? "조회 중..." : "티켓 조회하기"}
            </Button>
          </form>

          {/* Lookup Result Card */}
          {lookupResult && (
            <div className="p-5 rounded-xl border bg-muted/20 space-y-3 pt-4 animate-in fade-in-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-primary">
                  {lookupResult.ticket_code}
                </span>
                <div>
                  {lookupResult.status === "PENDING" && (
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      심사 대기 중
                    </span>
                  )}
                  {lookupResult.status === "APPROVED" && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      승인 완료
                    </span>
                  )}
                  {lookupResult.status === "REJECTED" && (
                    <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      반려됨
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground block text-[11px]">신청자명</span>
                  <span className="font-medium text-foreground">{lookupResult.applicant_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">현장 체크인</span>
                  <span className={`font-semibold ${lookupResult.checked_in ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {lookupResult.checked_in ? "입장 완료" : "미입장"}
                  </span>
                </div>
                {lookupResult.group_name && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[11px]">부스 / 단체명</span>
                    <span className="font-medium text-foreground">{lookupResult.group_name}</span>
                  </div>
                )}
              </div>

              {lookupResult.rejection_reason && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
                  <span className="font-semibold text-destructive block">반려 사유</span>
                  <p className="text-muted-foreground">{lookupResult.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Apply Form Screen */}
      {mode === "APPLY" && (
        <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-6 shadow-sm">
          {/* Form Header Info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {category === "BOOTH" && "🎪 축제 부스/주점 신청"}
                {category === "TICKET" && "🎫 행사 티켓/참가권 예매"}
                {category === "GENERAL" && "📋 일반 설문/참가 신청"}
              </span>

              {maxCapacity && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  잔여 {Math.max(0, maxCapacity - liveCount)}석 / 정원 {maxCapacity}명
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              {formTitle}
            </h1>

            {formDescription && (
              <div className="p-4 rounded-xl bg-muted/20 border text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {formDescription}
              </div>
            )}

            {endAt && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 pt-1">
                <Calendar className="size-3.5" />
                <span>신청 마감: {new Date(endAt).toLocaleString("ko-KR")}</span>
              </div>
            )}
          </div>

          {isFull ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-2">
              <AlertCircle className="size-6 text-destructive mx-auto" />
              <h3 className="text-sm font-bold text-destructive">신청이 마감되었습니다</h3>
              <p className="text-xs text-muted-foreground">
                준비된 모집 정원이 모두 채워졌습니다. 취소자가 발생할 경우 다시 신청할 수 있습니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
                  {error}
                </div>
              )}

              {/* 1. Applicant Base Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b pb-2">
                  기본 신청자 정보
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="applicant_name" className="text-xs font-semibold">
                      신청자 / 대표자 이름 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="applicant_name"
                      name="applicant_name"
                      placeholder="홍길동"
                      required
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="applicant_phone" className="text-xs font-semibold">
                      연락처 (휴대폰) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="applicant_phone"
                      name="applicant_phone"
                      placeholder="010-1234-5678"
                      required
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="applicant_student_id" className="text-xs font-semibold">
                      학번
                    </Label>
                    <Input
                      id="applicant_student_id"
                      name="applicant_student_id"
                      placeholder="예: 202612345"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="applicant_department" className="text-xs font-semibold">
                      소속 학과 / 단과대학
                    </Label>
                    <Input
                      id="applicant_department"
                      name="applicant_department"
                      placeholder="예: 경영학과, 공과대학"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="group_name" className="text-xs font-semibold">
                      {category === "BOOTH" ? "부스명 / 소속 동아리명" : "동아리 / 단체명 (해당 시)"}
                    </Label>
                    <Input
                      id="group_name"
                      name="group_name"
                      placeholder={category === "BOOTH" ? "예: 멋쟁이밴드 먹거리주점" : "예: 밴드동아리, 학생회"}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="applicant_email" className="text-xs font-semibold">
                      이메일 주소 (선택)
                    </Label>
                    <Input
                      id="applicant_email"
                      name="applicant_email"
                      type="email"
                      placeholder="student@univ.ac.kr"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Custom Questions */}
              {customFields.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b pb-2">
                    추가 설문 / 행사 질문
                  </h3>

                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={field.id} className="text-xs font-semibold">
                        {field.label}{" "}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>

                      {field.type === "text" && (
                        <Input
                          id={field.id}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                          value={(customResponses[field.id] as string) || ""}
                          onChange={(e) =>
                            setCustomResponses({ ...customResponses, [field.id]: e.target.value })
                          }
                          className="text-sm"
                        />
                      )}

                      {field.type === "number" && (
                        <Input
                          id={field.id}
                          type="number"
                          placeholder={field.placeholder || ""}
                          required={field.required}
                          value={(customResponses[field.id] as string) || ""}
                          onChange={(e) =>
                            setCustomResponses({ ...customResponses, [field.id]: e.target.value })
                          }
                          className="text-sm"
                        />
                      )}

                      {field.type === "textarea" && (
                        <textarea
                          id={field.id}
                          rows={3}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                          value={(customResponses[field.id] as string) || ""}
                          onChange={(e) =>
                            setCustomResponses({ ...customResponses, [field.id]: e.target.value })
                          }
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      )}

                      {field.type === "select" && (
                        <select
                          id={field.id}
                          required={field.required}
                          value={(customResponses[field.id] as string) || ""}
                          onChange={(e) =>
                            setCustomResponses({ ...customResponses, [field.id]: e.target.value })
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                        >
                          <option value="">-- 선택해 주세요 --</option>
                          {(field.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Consent and Submit */}
              <div className="pt-4 border-t space-y-3">
                <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      checked={isConsentChecked}
                      onChange={(e) => setIsConsentChecked(e.target.checked)}
                      className="mt-0.5 rounded border-input text-primary focus:ring-primary size-4 cursor-pointer"
                    />
                    <div className="flex-1 text-xs leading-snug">
                      <Label htmlFor="consent" className="font-semibold text-foreground cursor-pointer block">
                        [필수] 개인정보 수집·이용 및 행사 운영 규정 동의
                      </Label>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        수집 항목: 성명, 연락처, 학번 | 수집 목적: 티켓 발권 및 입장 확인 | 보유 기간: 행사 종료 후 30일
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConsentModalOpen(true)}
                      className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap px-1.5 py-0.5 rounded-md hover:bg-primary/5 transition-colors"
                    >
                      전문 보기
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || !isConsentChecked}
                  className="w-full h-11 text-sm font-semibold tracking-wide"
                >
                  {isPending ? "제출 및 티켓 발급 중..." : "신청서 제출 및 티켓 발급받기"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Privacy & Terms Modal */}
      <PrivacyConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAgree={() => setIsConsentChecked(true)}
        type="APPLY"
        title="[필수] 행사 참가자 개인정보 수집·이용 동의"
      />
    </div>
  );
}

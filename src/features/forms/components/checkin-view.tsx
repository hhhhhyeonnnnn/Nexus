"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Clock,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  toggleSubmissionCheckIn,
  type FormSubmissionRow,
  type EventFormWithStats,
} from "@/features/forms/actions";

export function CheckinView({
  form,
  submissions,
}: {
  form: EventFormWithStats;
  submissions: FormSubmissionRow[];
}) {
  const [query, setQuery] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const approvedSubmissions = useMemo(
    () => submissions.filter((s) => s.status === "APPROVED"),
    [submissions],
  );

  const checkedInCount = useMemo(
    () => approvedSubmissions.filter((s) => s.checked_in).length,
    [approvedSubmissions],
  );

  const totalApproved = approvedSubmissions.length;
  const progressPercent = totalApproved > 0 ? Math.round((checkedInCount / totalApproved) * 100) : 0;

  // Search match
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return approvedSubmissions.filter(
      (s) =>
        s.ticket_code.toLowerCase().includes(q) ||
        s.applicant_name.toLowerCase().includes(q) ||
        (s.applicant_student_id && s.applicant_student_id.toLowerCase().includes(q)) ||
        s.applicant_phone.replace(/[^0-9]/g, "").includes(q.replace(/[^0-9]/g, "")),
    );
  }, [query, approvedSubmissions]);

  // Recent check-ins list (sorted by checked_in_at desc)
  const recentCheckins = useMemo(() => {
    return submissions
      .filter((s) => s.checked_in && s.checked_in_at)
      .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
      .slice(0, 8);
  }, [submissions]);

  const handleCheckIn = (submissionId: string) => {
    startTransition(async () => {
      await toggleSubmissionCheckIn(submissionId, form.id);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header KPIs & Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card space-y-1">
          <span className="text-xs text-muted-foreground font-medium">총 승인 인원</span>
          <p className="text-2xl font-bold text-foreground">{totalApproved}명</p>
        </div>
        <div className="p-4 rounded-xl border bg-card space-y-1">
          <span className="text-xs text-muted-foreground font-medium">현장 입장 완료</span>
          <p className="text-2xl font-bold text-emerald-600">{checkedInCount}명</p>
        </div>
        <div className="p-4 rounded-xl border bg-card space-y-1">
          <span className="text-xs text-muted-foreground font-medium">미입장 잔여 인원</span>
          <p className="text-2xl font-bold text-amber-600">{Math.max(0, totalApproved - checkedInCount)}명</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <UserCheck className="size-4 text-primary" />
            현장 출석 입장률
          </span>
          <span className="font-mono font-bold text-primary">{progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Fast Search & Verify Desk */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Ticket className="size-4 text-primary" />
            실시간 티켓 / 참가자 확인 데스크
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            티켓 코드(예: TKT-2026-XXXX), 학번, 참가자 이름, 또는 휴대폰 번호 뒷자리로 검색하세요.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="티켓 코드 / 학번 / 이름 / 전화번호 검색..."
            className="pl-10 h-11 text-sm rounded-lg"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              지우기
            </button>
          )}
        </div>

        {/* Search Results */}
        {query.trim() && (
          <div className="space-y-3 pt-2">
            {matched.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground rounded-lg border border-dashed">
                일치하는 승인된 참가자를 찾을 수 없습니다. (미승인 상태이거나 검색어가 잘못되었을 수 있습니다)
              </div>
            ) : (
              matched.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    sub.checked_in
                      ? "bg-amber-50/50 border-amber-300 dark:bg-amber-950/20"
                      : "bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">
                        {sub.ticket_code}
                      </span>
                      {sub.checked_in ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="size-3" />
                          이미 입장 완료됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          <CheckCircle2 className="size-3" />
                          입장 대기 중
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {sub.applicant_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({sub.applicant_department || "학과 미기재"}{" "}
                        {sub.applicant_student_id ? `· ${sub.applicant_student_id}` : ""})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      연락처: <span className="font-mono font-medium">{sub.applicant_phone}</span>
                      {sub.group_name && ` | 단체/부스: ${sub.group_name}`}
                    </p>
                    {sub.checked_in && sub.checked_in_at && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        체크인 완료 시각: {new Date(sub.checked_in_at).toLocaleTimeString("ko-KR")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!sub.checked_in ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCheckIn(sub.id)}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 h-10 px-4"
                      >
                        <CheckCircle2 className="size-4" />
                        입장 확인 (Check-in)
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckIn(sub.id)}
                        disabled={isPending}
                        className="text-xs text-muted-foreground hover:text-foreground gap-1 h-9"
                      >
                        <RotateCcw className="size-3.5" />
                        체크인 취소
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Recent Check-in Activity */}
      {recentCheckins.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            최근 체크인 기록 ({recentCheckins.length}건)
          </h4>
          <div className="divide-y text-xs">
            {recentCheckins.map((sub) => (
              <div key={sub.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-foreground">{sub.applicant_name}</span>
                  <span className="font-mono text-muted-foreground text-[11px]">{sub.ticket_code}</span>
                  {sub.group_name && (
                    <span className="text-muted-foreground text-[11px]">({sub.group_name})</span>
                  )}
                </div>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {sub.checked_in_at ? new Date(sub.checked_in_at).toLocaleTimeString("ko-KR") : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

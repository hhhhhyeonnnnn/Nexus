"use client";

import { useState, useTransition } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateSubmissionStatus,
  toggleSubmissionCheckIn,
  type FormSubmissionRow,
  type EventFormWithStats,
  type CustomField,
} from "@/features/forms/actions";

export function SubmissionsTable({
  form,
  submissions,
}: {
  form: EventFormWithStats;
  submissions: FormSubmissionRow[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionRow | null>(null);
  const [rejectionModalSub, setRejectionModalSub] = useState<FormSubmissionRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const customFields = (form.custom_fields as unknown as CustomField[]) || [];

  // Filtered submissions
  const filtered = submissions.filter((sub) => {
    if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      sub.applicant_name.toLowerCase().includes(term) ||
      (sub.applicant_student_id && sub.applicant_student_id.toLowerCase().includes(term)) ||
      (sub.applicant_department && sub.applicant_department.toLowerCase().includes(term)) ||
      (sub.group_name && sub.group_name.toLowerCase().includes(term)) ||
      sub.applicant_phone.includes(term) ||
      sub.ticket_code.toLowerCase().includes(term)
    );
  });

  // Export to CSV with UTF-8 BOM for Excel
  const exportCsv = () => {
    if (submissions.length === 0) {
      alert("다운로드할 신청 내역이 없습니다.");
      return;
    }

    const headers = [
      "티켓코드",
      "상태",
      "체크인여부",
      "신청자명",
      "연락처",
      "학번",
      "소속학과",
      "단체/부스명",
      "신청일시",
      ...customFields.map((f) => f.label),
    ];

    const rows = submissions.map((sub) => {
      const responses = (sub.responses as Record<string, unknown>) || {};
      const customValues = customFields.map((f) => {
        const val = responses[f.id];
        return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val ? `"${val}"` : '""';
      });

      return [
        `"${sub.ticket_code}"`,
        `"${sub.status}"`,
        `"${sub.checked_in ? "입장완료" : "미입장"}"`,
        `"${sub.applicant_name.replace(/"/g, '""')}"`,
        `"${sub.applicant_phone}"`,
        `"${sub.applicant_student_id ?? ""}"`,
        `"${sub.applicant_department ?? ""}"`,
        `"${sub.group_name ?? ""}"`,
        `"${new Date(sub.created_at).toLocaleString("ko-KR")}"`,
        ...customValues,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${form.title.replace(/[\s/\\:*?"<>|]/g, "_")}_신청명단_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = (submissionId: string) => {
    startTransition(async () => {
      await updateSubmissionStatus(submissionId, form.id, "APPROVED");
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalSub) return;
    startTransition(async () => {
      await updateSubmissionStatus(
        rejectionModalSub.id,
        form.id,
        "REJECTED",
        rejectionReason.trim() || undefined,
      );
      setRejectionModalSub(null);
      setRejectionReason("");
    });
  };

  const handleCheckInToggle = (submissionId: string) => {
    startTransition(async () => {
      await toggleSubmissionCheckIn(submissionId, form.id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters, Search, CSV Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === "ALL"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            전체 ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-white font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock className="size-3" />
            대기 ({form.pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === "APPROVED"
                ? "bg-emerald-600 text-white font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="size-3" />
            승인 ({form.approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === "REJECTED"
                ? "bg-destructive text-destructive-foreground font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <XCircle className="size-3" />
            반려 ({submissions.filter((s) => s.status === "REJECTED").length})
          </button>
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 학번, 부스명, 티켓 검색..."
              className="pl-8 text-xs h-8"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="text-xs h-8 gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            <span>엑셀 다운로드</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">티켓 코드</th>
                <th className="py-3 px-4 font-semibold">신청자 / 대표자</th>
                <th className="py-3 px-4 font-semibold">소속 / 학번</th>
                <th className="py-3 px-4 font-semibold">
                  {form.category === "BOOTH" ? "부스 / 동아리명" : "신청 그룹"}
                </th>
                <th className="py-3 px-4 font-semibold">연락처</th>
                <th className="py-3 px-4 font-semibold">상태</th>
                <th className="py-3 px-4 font-semibold">현장 체크인</th>
                <th className="py-3 px-4 font-semibold text-right">심사 및 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-primary">
                      {sub.ticket_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {sub.applicant_name}
                      {sub.applicant_email && (
                        <span className="block text-[11px] text-muted-foreground">
                          {sub.applicant_email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {sub.applicant_department || "-"}
                      {sub.applicant_student_id && (
                        <span className="block text-[11px]">학번: {sub.applicant_student_id}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {sub.group_name || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {sub.applicant_phone}
                    </td>
                    <td className="py-3 px-4">
                      {sub.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          <Clock className="size-3" />
                          대기
                        </span>
                      )}
                      {sub.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          승인됨
                        </span>
                      )}
                      {sub.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
                          <XCircle className="size-3" />
                          반려됨
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleCheckInToggle(sub.id)}
                        disabled={isPending || sub.status !== "APPROVED"}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                          sub.checked_in
                            ? "bg-emerald-600 text-white"
                            : sub.status === "APPROVED"
                              ? "bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-800"
                              : "bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                        }`}
                        title={sub.checked_in ? "체크인 취소" : "체크인 완료 처리"}
                      >
                        <Check className="size-3" />
                        {sub.checked_in ? "입장 완료" : "미입장"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(sub)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          title="상세 답변 보기"
                        >
                          <Eye className="size-3.5 mr-1" />
                          상세
                        </Button>

                        {sub.status === "PENDING" && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(sub.id)}
                              disabled={isPending}
                              className="h-7 px-2 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            >
                              승인
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRejectionModalSub(sub);
                                setRejectionReason("");
                              }}
                              disabled={isPending}
                              className="h-7 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                            >
                              반려
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Submission Detail & Custom Responses */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">신청서 상세 정보</h3>
                <span className="font-mono text-xs text-primary font-medium">
                  {selectedSubmission.ticket_code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg">
                <div>
                  <span className="text-muted-foreground block text-[11px]">신청자/대표자</span>
                  <span className="font-semibold text-foreground">{selectedSubmission.applicant_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">연락처</span>
                  <span className="font-mono font-medium">{selectedSubmission.applicant_phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">소속 학과 / 학번</span>
                  <span>{selectedSubmission.applicant_department || "-"} ({selectedSubmission.applicant_student_id || "-"})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">단체/부스명</span>
                  <span className="font-medium">{selectedSubmission.group_name || "-"}</span>
                </div>
              </div>

              {/* Custom Questions Answers */}
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-foreground">맞춤 설문 응답</h4>
                {customFields.length === 0 ? (
                  <p className="text-muted-foreground text-xs">추가 설문 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {customFields.map((f) => {
                      const responses = (selectedSubmission.responses as Record<string, unknown>) || {};
                      const answer = responses[f.id];
                      return (
                        <div key={f.id} className="p-2.5 rounded-md border bg-background space-y-1">
                          <span className="text-[11px] text-muted-foreground font-medium block">
                            {f.label}
                          </span>
                          <span className="text-xs text-foreground font-medium block whitespace-pre-wrap">
                            {answer !== undefined && answer !== null && answer !== ""
                              ? String(answer)
                              : "(미응답)"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rejection reason if any */}
              {selectedSubmission.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-xs">
                  <span className="font-semibold text-destructive block">반려 사유</span>
                  <p className="text-muted-foreground mt-0.5">{selectedSubmission.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubmission(null)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason Input */}
      {rejectionModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="w-full max-w-md rounded-xl border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold text-destructive">신청서 반려 처리</h3>
              <button
                type="button"
                onClick={() => setRejectionModalSub(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{rejectionModalSub.applicant_name}</span>님의
                신청을 반려합니다. 사유를 입력해 주세요.
              </p>
              <div className="space-y-1.5">
                <label htmlFor="rejection-input" className="font-semibold text-foreground">
                  반려 사유 (선택)
                </label>
                <textarea
                  id="rejection-input"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="예: 정원 초과 또는 화기 사용 수칙 미준수로 인한 반려"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectionModalSub(null)}
                >
                  취소
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
                  {isPending ? "처리 중..." : "반려 확정"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

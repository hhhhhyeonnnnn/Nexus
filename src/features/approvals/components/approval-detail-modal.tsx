"use client";

import { useState, useMemo, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Stamp,
  Receipt,
  Building,
  Folder,
  User,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  approveApprovalStep,
  rejectApproval,
  type ApprovalStepItem,
  type ApprovalWithRelations,
} from "../actions";
import { useRealtimeSubscription } from "@/lib/supabase/realtime";

interface ApprovalDetailModalProps {
  approval: ApprovalWithRelations;
  onClose: () => void;
}

const TYPE_MAP: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  EXPENSE: { label: "지출 결의서", tone: "warning" },
  EVENT: { label: "행사·기획안", tone: "accent" },
  GENERAL: { label: "일반 품의서", tone: "neutral" },
};

export function ApprovalDetailModal({ approval: initialApproval, onClose }: ApprovalDetailModalProps) {
  const [approvalOverride, setApprovalOverride] = useState<Partial<ApprovalWithRelations> | null>(null);
  const [isPending, startTransition] = useTransition();

  useRealtimeSubscription<ApprovalWithRelations>({
    table: "approvals",
    filter: `id=eq.${initialApproval.id}`,
    onUpdate: (updatedRow) => {
      setApprovalOverride((prev) => ({ ...prev, ...updatedRow }));
    },
  });

  const approval = useMemo(
    () => ({ ...initialApproval, ...approvalOverride }),
    [initialApproval, approvalOverride],
  );

  // Approve / Reject Form States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [syncToLedger, setSyncToLedger] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const steps = (approval.steps as unknown as ApprovalStepItem[]) || [];
  const typeInfo = TYPE_MAP[approval.type] || { label: approval.type, tone: "neutral" as const };

  const handleApprove = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await approveApprovalStep(approval.id, approveComment, syncToLedger);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsApproveOpen(false);
        onClose();
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setErrorMsg("반려 사유를 입력해 주세요.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await rejectApproval(approval.id, rejectReason);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsRejectOpen(false);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusChip tone={typeInfo.tone}>{typeInfo.label}</StatusChip>
              <StatusChip
                tone={
                  approval.status === "APPROVED"
                    ? "success"
                    : approval.status === "REJECTED"
                    ? "destructive"
                    : "accent"
                }
              >
                {approval.status === "APPROVED"
                  ? "승인 완료"
                  : approval.status === "REJECTED"
                  ? "반려됨"
                  : `${approval.current_step}/${approval.total_steps}단계 결재 진행 중`}
              </StatusChip>
            </div>
            <h2 className="text-lg font-bold text-foreground">{approval.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Official Stamp Approval Line (한국 공문서 결재란 스타일) */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Stamp size={14} className="text-primary" />
              전자결재선 현황
            </span>
            <span className="text-[11px] text-muted-foreground">
              총 {approval.total_steps}단계 중 {approval.current_step}단계 심사
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* 1. 기안자 */}
            <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1">
              <span className="block text-[10px] text-muted-foreground">기안</span>
              <strong className="block text-foreground truncate">
                {approval.profiles?.name || "기안자"}
              </strong>
              <span className="inline-block rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                상신 완료
              </span>
              <span className="block text-[9px] text-muted-foreground">
                {new Date(approval.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            {/* 2. 단계별 심사자 */}
            {steps.map((st) => (
              <div
                key={st.step}
                className={`rounded-lg border p-2.5 space-y-1 ${
                  st.status === "APPROVED"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : st.status === "REJECTED"
                    ? "border-destructive/30 bg-destructive/5"
                    : approval.current_step === st.step && approval.status === "PENDING"
                    ? "border-primary/40 bg-primary/5"
                    : "bg-muted/10 opacity-70"
                }`}
              >
                <span className="block text-[10px] text-muted-foreground">{st.name}</span>
                <strong className="block text-foreground truncate">
                  {st.approver_name || (approval.current_step === st.step ? "검토 대기" : "-")}
                </strong>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    st.status === "APPROVED"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : st.status === "REJECTED"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {st.status === "APPROVED"
                    ? "승인 인장"
                    : st.status === "REJECTED"
                    ? "반려"
                    : "결재 대기"}
                </span>
                <span className="block text-[9px] text-muted-foreground truncate">
                  {st.decided_at ? new Date(st.decided_at).toLocaleDateString("ko-KR") : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rejection Banner */}
        {approval.status === "REJECTED" && approval.reject_reason && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-destructive">
              <AlertTriangle size={15} />
              <span>결재 반려 사유</span>
            </div>
            <p className="text-foreground whitespace-pre-line pl-5">
              {approval.reject_reason}
            </p>
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <User size={12} /> 기안자
            </span>
            <p className="font-semibold text-foreground mt-0.5">
              {approval.profiles?.name || "익명"}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <Building size={12} /> 담당 부서
            </span>
            <p className="font-semibold text-foreground mt-0.5">
              {approval.departments?.name || "전체/공통"}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <Folder size={12} /> 연계 프로젝트
            </span>
            <p className="font-semibold text-foreground mt-0.5">
              {approval.projects?.name || "일반 업무"}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-2.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <Receipt size={12} /> 기안 금액
            </span>
            <p className="font-bold text-primary mt-0.5">
              {approval.amount ? `${Number(approval.amount).toLocaleString()}원` : "-"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-xl border bg-card p-4.5 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">기안 내용 전문</h3>
          <div className="rounded-lg bg-muted/30 p-4 text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed min-h-[120px]">
            {approval.content}
          </div>
        </div>

        {/* History / Audit Logs */}
        {approval.approval_logs && approval.approval_logs.length > 0 && (
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-muted-foreground">결재 이력 타임라인</h4>
            <div className="space-y-1.5">
              {approval.approval_logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-md border bg-muted/20 px-3 py-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{log.actor_name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-primary font-medium">
                      {log.action === "SUBMIT"
                        ? "기안 상신"
                        : log.action === "FINAL_APPROVE"
                        ? "최종 승인"
                        : log.action === "APPROVE_STEP"
                        ? "단계 승인"
                        : "반려"}
                    </span>
                    {log.comment && (
                      <span className="text-muted-foreground">({log.comment})</span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(log.created_at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            닫기
          </Button>

          {approval.status === "PENDING" && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsRejectOpen(true)}
                disabled={isPending}
                className="gap-1 text-xs"
              >
                <XCircle size={14} />
                반려
              </Button>
              <Button
                size="sm"
                onClick={() => setIsApproveOpen(true)}
                disabled={isPending}
                className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 size={14} />
                결재 승인
              </Button>
            </div>
          )}
        </div>

        {/* Approve Confirmation Modal */}
        {isApproveOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-foreground">결재 승인 확인</h3>
              <p className="text-xs text-muted-foreground">
                이 문서를 승인하여 다음 결재 단계로 이관하거나 최종 확정합니다.
              </p>

              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">
                  승인 의견 (선택)
                </label>
                <input
                  type="text"
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  placeholder="예: 예산안 검토 완료 및 집행 승인"
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {approval.type === "EXPENSE" && (approval.amount || 0) > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-muted/40 p-2.5 text-xs">
                  <input
                    type="checkbox"
                    id="syncToLedger"
                    checked={syncToLedger}
                    onChange={(e) => setSyncToLedger(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="syncToLedger" className="cursor-pointer select-none">
                    최종 승인 시 회계 장부(`budgets`)에 지출로 자동 등록
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsApproveOpen(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {isPending ? "승인 처리 중..." : "최종 승인 확정"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {isRejectOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-destructive flex items-center gap-1.5">
                <AlertTriangle size={18} />
                기안서 반려 처리
              </h3>
              <p className="text-xs text-muted-foreground">
                기안자에게 전달할 명확한 반려 사유를 입력해 주세요.
              </p>

              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">
                  반려 사유 *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="예: 영수증 단가 불일치로 인한 재기안 요청"
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectOpen(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={isPending}
                  className="text-xs"
                >
                  {isPending ? "반려 처리 중..." : "반려 확정"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

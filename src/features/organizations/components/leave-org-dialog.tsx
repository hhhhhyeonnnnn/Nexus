"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leaveOrganization } from "@/features/organizations/actions";

interface LeaveOrgDialogProps {
  organizationName?: string;
  isPresident: boolean;
}

export function LeaveOrgDialog({
  organizationName,
  isPresident,
}: LeaveOrgDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setIsOpen(true);
  };

  const handleLeave = () => {
    setError(null);
    startTransition(async () => {
      const res = await leaveOrganization();
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={handleOpen}
        className="h-7 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        title="현재 학생회에서 탈퇴"
      >
        <LogOut size={12} />
        <span>학생회 탈퇴</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-destructive font-bold">
                <AlertTriangle className="size-5" />
                <h2 className="text-base text-foreground">학생회 탈퇴 확인</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                정말 {organizationName ? `[${organizationName}]` : "현재 학생회"}에서 탈퇴하시겠습니까?
              </p>

              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <p>• 탈퇴 후에는 해당 학생회의 모든 내부 데이터(회계, 결재, 회의록 등)에 접근할 수 없습니다.</p>
                <p>• 즉시 온보딩 화면으로 이동하며, <strong>다른 학생회에 가입 신청</strong>하거나 <strong>새 학생회를 생성</strong>할 수 있습니다.</p>
              </div>

              {isPresident && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ 현재 <strong>총학생회장(대표)</strong> 권한을 보유하고 있습니다. 다른 구성원이 남아있는 경우, 먼저 대표 권한을 다른 관리자에게 위임해야 탈퇴할 수 있습니다.
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="text-xs h-8"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={handleLeave}
                className="text-xs h-8 gap-1.5"
              >
                <LogOut size={13} />
                <span>{isPending ? "탈퇴 처리 중..." : "학생회 탈퇴하기"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

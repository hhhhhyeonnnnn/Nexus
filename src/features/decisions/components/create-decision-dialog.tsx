"use client";

import { useState, useTransition } from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDecision } from "@/features/decisions/actions";

interface CreateDecisionDialogProps {
  projects: Array<{ id: string; name: string }>;
  meetings?: Array<{ id: string; title: string }>;
  defaultMeetingId?: string;
  defaultProjectId?: string;
  buttonLabel?: string;
}

export function CreateDecisionDialog({
  projects,
  meetings = [],
  defaultMeetingId,
  defaultProjectId,
  buttonLabel = "새 결정사항 등록",
}: CreateDecisionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (defaultMeetingId) {
      formData.set("meeting_id", defaultMeetingId);
    }
    setError(null);

    startTransition(async () => {
      const res = await createDecision({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
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
          setIsOpen(true);
        }}
        className="gap-1.5 text-xs h-8.5 font-medium"
      >
        <Plus size={15} />
        <span>{buttonLabel}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0 text-left">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>학생회 핵심 결정사항(Decision) 등록</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="decision-title" className="text-xs font-semibold">
                  결정 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="decision-title"
                  name="title"
                  placeholder="예: 축제 입장권 가격 재학생 3,000원 / 외부인 5,000원 확정"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="decision-content" className="text-xs font-semibold">
                  결정 내용 및 의결 사항 <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="decision-content"
                  name="content"
                  rows={3}
                  placeholder="예: 2026 봄 대동제 입장권 차등 판매안이 만장일치로 가결됨. 예매는 총학생회 공식 웹사이트에서 사전 신청받음."
                  required
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="decision-reason" className="text-xs font-semibold">
                  결정 배경 / 사유 (선택)
                </Label>
                <textarea
                  id="decision-reason"
                  name="reason"
                  rows={2}
                  placeholder="예: 최근 무대 음향 및 안전 인력 용역 비용 15% 상승에 따른 재정 건전성 확보 목적"
                  className="w-full p-2 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="decision-date" className="text-xs font-semibold">
                    결정 일자 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="decision-date"
                    name="decided_at"
                    type="date"
                    defaultValue={todayStr}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="decision-project" className="text-xs font-semibold">
                    관련 프로젝트
                  </Label>
                  <select
                    id="decision-project"
                    name="project_id"
                    defaultValue={defaultProjectId || ""}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- 연관 프로젝트 없음 --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Meeting (if not fixed by defaultMeetingId) */}
              {!defaultMeetingId && meetings.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="decision-meeting" className="text-xs font-semibold">
                    연관 회의록 (선택)
                  </Label>
                  <select
                    id="decision-meeting"
                    name="meeting_id"
                    defaultValue=""
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- 연관 회의 없음 --</option>
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "저장 중..." : "결정사항 등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

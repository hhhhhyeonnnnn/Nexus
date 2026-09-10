"use client";

import { useState, useTransition } from "react";
import { Edit2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDecision, type DecisionWithContext } from "@/features/decisions/actions";

interface EditDecisionDialogProps {
  decision: DecisionWithContext;
  projects: Array<{ id: string; name: string }>;
  meetings?: Array<{ id: string; title: string }>;
}

export function EditDecisionDialog({
  decision,
  projects,
  meetings = [],
}: EditDecisionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dateStr = decision.decided_at ? decision.decided_at.slice(0, 10) : "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("decision_id", decision.id);
    setError(null);

    startTransition(async () => {
      const res = await updateDecision({ error: null }, formData);
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
        variant="ghost"
        size="sm"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="결정사항 수정"
      >
        <Edit2 size={13} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0 text-left">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>결정사항(Decision) 수정</span>
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
                <Label htmlFor={`edit-dec-title-${decision.id}`} className="text-xs font-semibold">
                  결정 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edit-dec-title-${decision.id}`}
                  name="title"
                  defaultValue={decision.title}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-dec-content-${decision.id}`} className="text-xs font-semibold">
                  결정 내용 및 의결 사항 <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id={`edit-dec-content-${decision.id}`}
                  name="content"
                  rows={3}
                  defaultValue={decision.content}
                  required
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-dec-reason-${decision.id}`} className="text-xs font-semibold">
                  결정 배경 / 사유 (선택)
                </Label>
                <textarea
                  id={`edit-dec-reason-${decision.id}`}
                  name="reason"
                  rows={2}
                  defaultValue={decision.reason || ""}
                  className="w-full p-2 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-dec-date-${decision.id}`} className="text-xs font-semibold">
                    결정 일자 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`edit-dec-date-${decision.id}`}
                    name="decided_at"
                    type="date"
                    defaultValue={dateStr}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`edit-dec-proj-${decision.id}`} className="text-xs font-semibold">
                    관련 프로젝트
                  </Label>
                  <select
                    id={`edit-dec-proj-${decision.id}`}
                    name="project_id"
                    defaultValue={decision.project_id || ""}
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

              {meetings.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-dec-meet-${decision.id}`} className="text-xs font-semibold">
                    연관 회의록 (선택)
                  </Label>
                  <select
                    id={`edit-dec-meet-${decision.id}`}
                    name="meeting_id"
                    defaultValue={decision.meeting_id || ""}
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
                  {isPending ? "저장 중..." : "수정 완료"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

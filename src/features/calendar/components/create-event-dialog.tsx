"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/features/calendar/actions";

interface CreateEventDialogProps {
  projects: Array<{ id: string; name: string }>;
  defaultDate?: string;
}

export function CreateEventDialog({ projects, defaultDate }: CreateEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const todayStr = defaultDate || new Date().toISOString().slice(0, 10);
  const defaultStart = `${todayStr}T10:00`;
  const defaultEnd = `${todayStr}T12:00`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const res = await createEvent({ error: null }, formData);
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
        <span>새 일정 등록</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">새 학생회 일정 등록</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-title">일정 제목 *</Label>
                <Input
                  id="event-title"
                  name="title"
                  placeholder="예: 2학기 중간고사 야식사업, 정기 대의원회"
                  disabled={isPending}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-start">시작 일시 *</Label>
                  <Input
                    id="event-start"
                    name="start_at"
                    type="datetime-local"
                    defaultValue={defaultStart}
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-end">종료 일시 *</Label>
                  <Input
                    id="event-end"
                    name="end_at"
                    type="datetime-local"
                    defaultValue={defaultEnd}
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              {projects.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-project">연결 프로젝트 (선택)</Label>
                  <select
                    id="event-project"
                    name="project_id"
                    disabled={isPending}
                    className="h-8.5 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">(연결 프로젝트 없음)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="text-xs h-8"
                >
                  취소
                </Button>
                <Button type="submit" disabled={isPending} className="text-xs h-8">
                  {isPending ? "등록 중..." : "일정 등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

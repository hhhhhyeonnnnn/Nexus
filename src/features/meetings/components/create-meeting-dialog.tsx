"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMeeting } from "@/features/meetings/actions";
import { useRouter } from "next/navigation";

interface CreateMeetingDialogProps {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
}

export function CreateMeetingDialog({ projects, defaultProjectId }: CreateMeetingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const res = await createMeeting({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        if (res.meetingId) {
          router.push(`/meetings/${res.meetingId}`);
        }
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
        <span>새 회의록 작성</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">새 학생회 회의록 작성</h2>
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
                <Label htmlFor="meeting-title" className="text-xs font-semibold">
                  회의 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="meeting-title"
                  name="title"
                  placeholder="예: 2026학년도 1학기 3차 정기 확대운영위원회"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-date" className="text-xs font-semibold">
                    회의 일시 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="meeting-date"
                    name="meeting_date"
                    type="datetime-local"
                    defaultValue={localIso}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="meeting-project" className="text-xs font-semibold">
                    관련 프로젝트 (선택)
                  </Label>
                  <select
                    id="meeting-project"
                    name="project_id"
                    defaultValue={defaultProjectId || ""}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- 전체/일반 회의 --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meeting-attendees" className="text-xs font-semibold">
                  참석자
                </Label>
                <Input
                  id="meeting-attendees"
                  name="attendees"
                  placeholder="예: 김회장, 이부회장, 박기획국장, 정복지국장"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meeting-content" className="text-xs font-semibold">
                  회의 내용 및 안건
                </Label>
                <textarea
                  id="meeting-content"
                  name="content"
                  rows={8}
                  placeholder={`## 1. 개회 및 성원 보고
- 재적 12명 중 10명 참석으로 개회

## 2. 주요 안건
1) 축제 부스 운영 규칙 승인 건
2) 학생회비 납부자 간식 수량 산정의 건

## 3. 논의 및 회의 내용
- ...`}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono leading-relaxed"
                />
              </div>

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
                  {isPending ? "저장 중..." : "회의록 작성"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

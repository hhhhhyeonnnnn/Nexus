"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTask } from "@/features/tasks/actions";

type ProjectOption = {
  id: string;
  name: string;
};

type MemberOption = {
  user_id: string;
  profiles: {
    name: string;
    email: string;
  } | null;
};

export function CreateTaskDialog({
  projects = [],
  members = [],
  defaultProjectId,
  buttonLabel = "새 업무",
}: {
  projects?: ProjectOption[];
  members?: MemberOption[];
  defaultProjectId?: string;
  buttonLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createTask({ error: null }, formData);
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
      <Button onClick={() => setIsOpen(true)} size="default" className="gap-1.5 text-xs">
        <Plus className="size-3.5" aria-hidden="true" />
        <span>{buttonLabel}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">새 업무 등록</h2>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">업무 제목 *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="예: 무대 음향 장비 렌탈 업체 견적 비교"
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">상세 설명</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="업무 진행 시 참고할 사항을 입력하세요"
                  disabled={isPending}
                />
              </div>

              {defaultProjectId ? (
                <input type="hidden" name="project_id" value={defaultProjectId} />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="project_id">연결할 프로젝트</Label>
                  <select
                    id="project_id"
                    name="project_id"
                    disabled={isPending}
                    className="h-8.5 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">(프로젝트 미지정 - 일반 업무)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="assignee_id">담당자</Label>
                  <select
                    id="assignee_id"
                    name="assignee_id"
                    disabled={isPending}
                    className="h-8.5 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">(담당자 미지정)</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profiles?.name || m.profiles?.email || `구성원 (${m.user_id.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="due_date">마감일</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">초기 상태</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="TODO"
                  disabled={isPending}
                  className="h-8.5 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="TODO">대기 (TODO)</option>
                  <option value="IN_PROGRESS">진행 중 (IN_PROGRESS)</option>
                  <option value="DONE">완료 (DONE)</option>
                </select>
              </div>

              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "등록 중…" : "업무 등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

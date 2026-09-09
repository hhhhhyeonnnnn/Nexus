"use client";

import { useState, useTransition } from "react";
import { Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProject } from "@/features/projects/actions";
import type { Database } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function EditProjectDialog({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProject({ error: null }, formData);
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
      <Button variant="outline" size="default" onClick={() => setIsOpen(true)} className="gap-1.5 text-xs">
        <Edit2 className="size-3.5" />
        <span>정보 수정</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">프로젝트 정보 수정</h2>
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
              <input type="hidden" name="project_id" value={project.id} />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">프로젝트 이름 *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={project.name}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">프로젝트 설명</Label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={project.description}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start_date">시작일</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    defaultValue={project.start_date ?? ""}
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end_date">종료일</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    defaultValue={project.end_date ?? ""}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">상태</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={project.status}
                  disabled={isPending}
                  className="h-8.5 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="PLANNED">계획됨 (PLANNED)</option>
                  <option value="IN_PROGRESS">진행 중 (IN_PROGRESS)</option>
                  <option value="COMPLETED">완료됨 (COMPLETED)</option>
                  <option value="ARCHIVED">보관됨 (ARCHIVED)</option>
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
                  {isPending ? "저장 중…" : "변경사항 저장"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartment } from "@/features/departments/actions";
import { DEPARTMENT_COLORS } from "@/features/departments/utils";

export function CreateDepartmentDialog({
  buttonVariant = "default",
  buttonSize = "default",
  buttonLabel = "부서 추가",
}: {
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm";
  buttonLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("blue");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("color", selectedColor);

    startTransition(async () => {
      const res = await createDepartment({ error: null }, formData);
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
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => {
          setError(null);
          setSelectedColor("blue");
          setIsOpen(true);
        }}
        className="gap-1.5 text-xs font-medium"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        <span>{buttonLabel}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">새 부서(국) 추가</h2>
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
                <Label htmlFor="dept-name">부서명 *</Label>
                <Input
                  id="dept-name"
                  name="name"
                  required
                  placeholder="예: 기획국, 사무재정국, 홍보디자인국"
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dept-desc">주요 역할 및 업무 설명</Label>
                <textarea
                  id="dept-desc"
                  name="description"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="예: 축제 및 문화행사 총괄 기획, 예산 편성과 집행 관리"
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>부서 대표 색상</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DEPARTMENT_COLORS.map((item) => {
                    const isSelected = selectedColor === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedColor(item.value)}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 font-semibold text-foreground ring-1 ring-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span className={`size-3 rounded-full ${item.dot} shrink-0`} />
                        <span className="truncate">{item.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dept-sort">정렬 순서</Label>
                <Input
                  id="dept-sort"
                  name="sort_order"
                  type="number"
                  defaultValue={1}
                  min={0}
                  max={99}
                  className="w-24"
                  disabled={isPending}
                />
                <p className="text-[11px] text-muted-foreground">
                  조직도에 표시될 순서입니다 (낮은 번호가 먼저 표시).
                </p>
              </div>

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
                  {isPending ? "추가 중..." : "부서 생성"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

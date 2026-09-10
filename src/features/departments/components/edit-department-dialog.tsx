"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDepartment, deleteDepartment, type DepartmentRow } from "@/features/departments/actions";
import { DEPARTMENT_COLORS } from "@/features/departments/utils";

export function EditDepartmentDialog({
  department,
}: {
  department: DepartmentRow;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(department.color || "blue");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("department_id", department.id);
    formData.set("color", selectedColor);

    startTransition(async () => {
      const res = await updateDepartment({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setError(null);
        setIsOpen(false);
      }
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        `'${department.name}' 부서를 삭제하시겠습니까?\n소속된 구성원 및 업무, 예산의 부서 정보가 '미지정'으로 변경됩니다.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteDepartment(department.id);
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
          setSelectedColor(department.color || "blue");
          setIsOpen(true);
        }}
        className="size-7 p-0 text-muted-foreground hover:text-foreground"
        title="부서 설정 및 삭제"
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">부서 정보 수정</h2>
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
                <Label htmlFor="edit-dept-name">부서명 *</Label>
                <Input
                  id="edit-dept-name"
                  name="name"
                  defaultValue={department.name}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-dept-desc">주요 역할 및 업무 설명</Label>
                <textarea
                  id="edit-dept-desc"
                  name="description"
                  defaultValue={department.description}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                <Label htmlFor="edit-dept-sort">정렬 순서</Label>
                <Input
                  id="edit-dept-sort"
                  name="sort_order"
                  type="number"
                  defaultValue={department.sort_order}
                  min={0}
                  max={99}
                  className="w-24"
                  disabled={isPending}
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                >
                  <Trash2 className="size-3.5" />
                  <span>부서 삭제</span>
                </Button>

                <div className="flex items-center gap-2">
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
                    {isPending ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

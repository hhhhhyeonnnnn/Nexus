"use client";

import { useState, useTransition } from "react";
import { Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assignMemberDepartment } from "@/features/departments/actions";

interface AssignMemberDialogProps {
  member: {
    userId: string;
    name: string;
    departmentId?: string | null;
    jobTitle?: string | null;
  };
  departments: Array<{ id: string; name: string; color: string }>;
  triggerLabel?: string;
  triggerVariant?: "outline" | "ghost" | "default";
}

const COMMON_TITLES = ["국장", "부국장", "차장", "팀장", "국원", "팀원"];

export function AssignMemberDialog({
  member,
  departments,
  triggerLabel = "부서/직책 설정",
  triggerVariant = "outline",
}: AssignMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(member.departmentId || "");
  const [jobTitle, setJobTitle] = useState<string>(member.jobTitle || "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("target_user_id", member.userId);
    formData.set("department_id", selectedDeptId);
    formData.set("job_title", jobTitle);

    startTransition(async () => {
      const res = await assignMemberDepartment({ error: null }, formData);
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
        variant={triggerVariant}
        onClick={() => {
          setSelectedDeptId(member.departmentId || "");
          setJobTitle(member.jobTitle || "");
          setError(null);
          setIsOpen(true);
        }}
        className="h-8 text-xs gap-1.5"
      >
        <Briefcase className="size-3.5" />
        <span>{triggerLabel}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">
                부서 및 직책 설정 <span className="font-normal text-muted-foreground">({member.name})</span>
              </h2>
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
                <Label htmlFor="assign-dept">소속 부서</Label>
                <select
                  id="assign-dept"
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">미지정 (소속 부서 없음)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assign-title">직책 (역할명)</Label>
                <Input
                  id="assign-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="예: 기획국장, 총괄차장, 디자인팀원"
                  disabled={isPending}
                />
                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground mr-1">추천:</span>
                  {COMMON_TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const currentDept = departments.find((d) => d.id === selectedDeptId);
                        if (currentDept) {
                          const baseName = currentDept.name.replace(/국$|부$|팀$/, "");
                          setJobTitle(`${baseName}${t}`);
                        } else {
                          setJobTitle(t);
                        }
                      }}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
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
                  {isPending ? "저장 중..." : "설정 완료"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

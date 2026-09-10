"use client";

import { useState, useTransition } from "react";
import { Plus, FileCheck2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createApproval } from "../actions";

interface CreateApprovalDialogProps {
  departments: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function CreateApprovalDialog({
  departments,
  projects,
}: CreateApprovalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"EXPENSE" | "EVENT" | "GENERAL">("EXPENSE");
  const [amount, setAmount] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = amount ? Number(amount.replace(/[^0-9]/g, "")) : undefined;

    // Define 2-step approval line
    const steps = [
      { step: 1, name: "담당 부서장/팀장 검토", role: "HEAD" },
      { step: 2, name: "총학생회장/재정국장 최종 승인", role: "PRESIDENT" },
    ];

    startTransition(async () => {
      const res = await createApproval({
        title,
        type,
        amount: parsedAmount,
        content,
        department_id: departmentId || undefined,
        project_id: projectId || undefined,
        steps,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsOpen(false);
        setTitle("");
        setType("EXPENSE");
        setAmount("");
        setDepartmentId("");
        setProjectId("");
        setContent("");
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs font-medium"
      >
        <Plus size={15} />
        새 기안서 상신
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="text-primary size-5" />
                <h2 className="text-base font-semibold">전자결재 기안서 작성</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type Selection */}
              <div>
                <label className="block font-medium mb-1.5 text-foreground">결재 문서 구분 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "EXPENSE", label: "💰 지출 결의서" },
                    { key: "EVENT", label: "🎪 행사·기획안" },
                    { key: "GENERAL", label: "📝 일반 품의서" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setType(item.key as "EXPENSE" | "EVENT" | "GENERAL")}
                      className={`rounded-lg border p-2.5 text-center font-medium transition-colors ${
                        type === item.key
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-input bg-card text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-foreground">기안 제목 *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2026학년도 봄 정기 간식나눔 행사 예산 지출 결의"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {type === "EXPENSE" && (
                <div>
                  <label className="block font-medium mb-1 text-foreground">지출 요청 금액 (원) *</label>
                  <input
                    type="text"
                    required
                    value={amount ? Number(amount.replace(/[^0-9]/g, "")).toLocaleString() : ""}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="예: 450,000"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm font-semibold text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-foreground">담당 부서</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="">(선택 없음)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-foreground">연계 프로젝트</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="">(선택 없음)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-foreground">기안 내용 및 사유 *</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="품의 목적, 예산 산출 근거, 세부 집행 일정 등을 구체적으로 기재해 주세요."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Approval Line Preview */}
              <div className="rounded-lg bg-muted/40 border p-3 space-y-2">
                <span className="font-semibold text-foreground block">지정 결재선 (2단계)</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 rounded-md bg-background border p-2 text-center">
                    <span className="block text-[10px] text-muted-foreground">1단계 (검토)</span>
                    <strong className="text-foreground text-xs">담당 부서장</strong>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/60" />
                  <div className="flex-1 rounded-md bg-background border p-2 text-center">
                    <span className="block text-[10px] text-muted-foreground">2단계 (최종승인)</span>
                    <strong className="text-foreground text-xs">회장단 / 재정국</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
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
                  {isPending ? "상신 중..." : "결재선 상신"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

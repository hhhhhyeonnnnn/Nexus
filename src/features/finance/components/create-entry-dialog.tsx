"use client";

import { useState, useTransition } from "react";
import { Plus, X, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLedgerEntry } from "@/features/finance/actions";

export const FINANCE_CATEGORIES = [
  "학생회비",
  "행사·축제비",
  "홍보·인쇄비",
  "복지·간식비",
  "비품·운영비",
  "제휴·후원금",
  "기타",
];

interface CreateEntryDialogProps {
  vendors: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function CreateEntryDialog({ vendors, projects }: CreateEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amountStr, setAmountStr] = useState<string>("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", entryType);
    setError(null);

    startTransition(async () => {
      const res = await createLedgerEntry({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        setAmountStr("");
      }
    });
  };

  const formattedAmount = Number(amountStr)
    ? Number(amountStr).toLocaleString("ko-KR")
    : "";

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError(null);
          setEntryType("EXPENSE");
          setAmountStr("");
          setIsOpen(true);
        }}
        className="gap-1.5 text-xs h-8.5 font-medium"
      >
        <Plus size={15} />
        <span>새 거래 등록</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">새 회계 장부 거래 등록</h2>
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Type Switcher: 지출 vs 수입 */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setEntryType("EXPENSE")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    entryType === "EXPENSE"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowDownRight size={15} />
                  <span>지출 (EXPENSE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType("INCOME")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    entryType === "INCOME"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowUpRight size={15} />
                  <span>수입 (INCOME)</span>
                </button>
              </div>

              {/* Title / Description */}
              <div className="space-y-1.5">
                <Label htmlFor="entry-title" className="text-xs font-semibold">
                  항목명 / 적요 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="entry-title"
                  name="title"
                  placeholder={
                    entryType === "EXPENSE"
                      ? "예: 축제 메인 현수막 인쇄, 간식행사 햄버거 100세트"
                      : "예: 1학기 컴퓨터공학과 학생회비 일괄 입금, 단과대 지원금"
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="entry-amount" className="text-xs font-semibold">
                      금액 (원) <span className="text-red-500">*</span>
                    </Label>
                    {formattedAmount && (
                      <span className="text-[11px] font-semibold text-primary">
                        ₩{formattedAmount}원
                      </span>
                    )}
                  </div>
                  <Input
                    id="entry-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="entry-date" className="text-xs font-semibold">
                    거래 일자 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="entry-date"
                    name="transaction_date"
                    type="date"
                    defaultValue={todayStr}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Category & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="entry-category" className="text-xs font-semibold">
                    카테고리
                  </Label>
                  <select
                    id="entry-category"
                    name="category"
                    defaultValue={entryType === "INCOME" ? "학생회비" : "행사·축제비"}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {FINANCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="entry-project" className="text-xs font-semibold">
                    관련 프로젝트 (선택)
                  </Label>
                  <select
                    id="entry-project"
                    name="project_id"
                    defaultValue=""
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

              {/* Vendor & Receipt URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="entry-vendor" className="text-xs font-semibold">
                    거래처 / 협력업체 (선택)
                  </Label>
                  <select
                    id="entry-vendor"
                    name="vendor_id"
                    defaultValue=""
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- 거래처 미선택 --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="entry-receipt" className="text-xs font-semibold">
                    영수증/증빙 링크 (선택)
                  </Label>
                  <Input
                    id="entry-receipt"
                    name="receipt_url"
                    placeholder="https://drive.google.com/..."
                    className="h-8 text-xs"
                  />
                </div>
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
                  {isPending ? "저장 중..." : "거래 등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

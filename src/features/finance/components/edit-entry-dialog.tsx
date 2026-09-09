"use client";

import { useState, useTransition } from "react";
import { Edit2, X, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLedgerEntry, type LedgerEntry } from "@/features/finance/actions";
import { FINANCE_CATEGORIES } from "./create-entry-dialog";

interface EditEntryDialogProps {
  entry: LedgerEntry;
  vendors: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function EditEntryDialog({ entry, vendors, projects }: EditEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">(
    entry.type === "INCOME" ? "INCOME" : "EXPENSE",
  );
  const [amountStr, setAmountStr] = useState<string>(String(entry.actual_amount ?? 0));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("entry_id", entry.id);
    formData.set("type", entryType);
    setError(null);

    startTransition(async () => {
      const res = await updateLedgerEntry({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
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
        variant="ghost"
        size="sm"
        onClick={() => {
          setError(null);
          setEntryType(entry.type === "INCOME" ? "INCOME" : "EXPENSE");
          setAmountStr(String(entry.actual_amount ?? 0));
          setIsOpen(true);
        }}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="거래 수정"
      >
        <Edit2 size={13} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0 text-left">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">회계 장부 거래 수정</h2>
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

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor={`edit-entry-title-${entry.id}`} className="text-xs font-semibold">
                  항목명 / 적요 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edit-entry-title-${entry.id}`}
                  name="title"
                  defaultValue={entry.title}
                  required
                  className="h-8 text-xs"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`edit-entry-amount-${entry.id}`} className="text-xs font-semibold">
                      금액 (원) <span className="text-red-500">*</span>
                    </Label>
                    {formattedAmount && (
                      <span className="text-[11px] font-semibold text-primary">
                        ₩{formattedAmount}원
                      </span>
                    )}
                  </div>
                  <Input
                    id={`edit-entry-amount-${entry.id}`}
                    name="amount"
                    type="number"
                    min="0"
                    step="1"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`edit-entry-date-${entry.id}`} className="text-xs font-semibold">
                    거래 일자 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`edit-entry-date-${entry.id}`}
                    name="transaction_date"
                    type="date"
                    defaultValue={entry.transaction_date ?? ""}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Category & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-entry-cat-${entry.id}`} className="text-xs font-semibold">
                    카테고리
                  </Label>
                  <select
                    id={`edit-entry-cat-${entry.id}`}
                    name="category"
                    defaultValue={entry.category ?? "기타"}
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
                  <Label htmlFor={`edit-entry-proj-${entry.id}`} className="text-xs font-semibold">
                    관련 프로젝트 (선택)
                  </Label>
                  <select
                    id={`edit-entry-proj-${entry.id}`}
                    name="project_id"
                    defaultValue={entry.project_id ?? ""}
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
                  <Label htmlFor={`edit-entry-vend-${entry.id}`} className="text-xs font-semibold">
                    거래처 / 협력업체 (선택)
                  </Label>
                  <select
                    id={`edit-entry-vend-${entry.id}`}
                    name="vendor_id"
                    defaultValue={entry.vendor_id ?? ""}
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
                  <Label htmlFor={`edit-entry-rcpt-${entry.id}`} className="text-xs font-semibold">
                    영수증/증빙 링크 (선택)
                  </Label>
                  <Input
                    id={`edit-entry-rcpt-${entry.id}`}
                    name="receipt_url"
                    defaultValue={entry.receipt_url ?? ""}
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

"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Trash2,
  Receipt,
  FolderKanban,
  Building2,
  Calendar,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteLedgerEntry, type LedgerEntry } from "@/features/finance/actions";
import { EditEntryDialog } from "./edit-entry-dialog";
import { FINANCE_CATEGORIES } from "./create-entry-dialog";
import { getDepartmentColorClasses } from "@/features/departments/utils";

interface LedgerTableProps {
  entries: LedgerEntry[];
  vendors: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string; color: string }>;
  isAdmin: boolean;
}

export function LedgerTable({
  entries,
  vendors,
  projects,
  departments = [],
  isAdmin,
}: LedgerTableProps) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [previewReceiptTitle, setPreviewReceiptTitle] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Type filter
      if (typeFilter !== "ALL" && entry.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "ALL" && entry.category !== categoryFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== "ALL" && entry.department_id !== departmentFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchCategory = (entry.category || "").toLowerCase().includes(q);
      const matchVendor = (entry.vendorName || "").toLowerCase().includes(q);
      const matchProject = (entry.projectName || "").toLowerCase().includes(q);
      const matchDepartment = (entry.departmentName || "").toLowerCase().includes(q);

      return matchTitle || matchCategory || matchVendor || matchProject || matchDepartment;
    });
  }, [entries, typeFilter, categoryFilter, departmentFilter, searchQuery]);

  const handleDelete = (entry: LedgerEntry) => {
    if (!confirm(`'${entry.title}' 내역을 장부에서 삭제하시겠습니까?`)) {
      return;
    }
    startTransition(async () => {
      await deleteLedgerEntry(entry.id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Type tabs + Category + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              typeFilter === "ALL"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            전체 ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("EXPENSE")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              typeFilter === "EXPENSE"
                ? "bg-rose-500 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownRight size={13} />
            <span>지출</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("INCOME")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              typeFilter === "INCOME"
                ? "bg-emerald-500 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight size={13} />
            <span>수입</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">전체 카테고리</option>
            {FINANCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Department Dropdown */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">전체 부서</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="적요, 부서, 프로젝트 검색..."
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>
      </div>

      {/* Ledger Records Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-2.5 px-3.5 whitespace-nowrap">거래일자</th>
                <th className="py-2.5 px-3 whitespace-nowrap">구분</th>
                <th className="py-2.5 px-3.5">적요 / 거래 항목</th>
                <th className="py-2.5 px-3 whitespace-nowrap">카테고리</th>
                <th className="py-2.5 px-3 whitespace-nowrap">부서</th>
                <th className="py-2.5 px-3 whitespace-nowrap">프로젝트</th>
                <th className="py-2.5 px-3 whitespace-nowrap">거래처</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">금액 (원)</th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap">증빙</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <Receipt className="mx-auto mb-2 text-muted-foreground/40" size={28} />
                    <p className="font-medium text-foreground">
                      {searchQuery || categoryFilter !== "ALL" || typeFilter !== "ALL"
                        ? "조건에 맞는 거래 내역이 없습니다."
                        : "등록된 장부 거래 내역이 없습니다."}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      상단의 [새 거래 등록] 버튼으로 첫 수입 또는 지출을 기록해 보세요.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isIncome = entry.type === "INCOME";
                  const formattedAmt = (entry.actual_amount ?? 0).toLocaleString("ko-KR");

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-3.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-muted-foreground/60" />
                          <span>{entry.transaction_date || entry.created_at?.slice(0, 10)}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                              : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                          }`}
                        >
                          {isIncome ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          <span>{isIncome ? "수입" : "지출"}</span>
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-3.5 font-medium text-foreground max-w-xs truncate">
                        {entry.title}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/50">
                          {entry.category || "기타"}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {entry.departmentName ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              getDepartmentColorClasses(entry.departmentColor).badge
                            }`}
                          >
                            {entry.departmentName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>

                      {/* Project */}
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap max-w-[120px] truncate">
                        {entry.projectName ? (
                          <div className="flex items-center gap-1 text-primary" title={entry.projectName}>
                            <FolderKanban size={12} className="shrink-0" />
                            <span className="truncate">{entry.projectName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap max-w-[120px] truncate">
                        {entry.vendorName ? (
                          <div className="flex items-center gap-1" title={entry.vendorName}>
                            <Building2 size={12} className="shrink-0 text-muted-foreground/70" />
                            <span className="truncate">{entry.vendorName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isIncome ? `+₩${formattedAmt}` : `-₩${formattedAmt}`}
                        </span>
                      </td>

                      {/* Receipt Link */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {entry.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewReceiptUrl(entry.receipt_url);
                              setPreviewReceiptTitle(entry.title);
                            }}
                            className="inline-flex items-center justify-center p-1 rounded hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                            title="영수증/증빙 사진 보기"
                          >
                            <ExternalLink size={13} />
                          </button>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-0.5">
                          <EditEntryDialog
                            entry={entry}
                            vendors={vendors}
                            projects={projects}
                            departments={departments}
                          />
                          {isAdmin && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry)}
                              disabled={isPending}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="삭제"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Image Lightbox Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/30">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground truncate max-w-sm">
                  {previewReceiptTitle || "영수증 증빙"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/10 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewReceiptUrl}
                alt="영수증 증빙"
                className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
            <div className="flex justify-end p-3 border-t bg-card">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewReceiptUrl(null)}
                className="text-xs h-7.5"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Receipt, ArrowDownRight, ArrowUpRight, Wallet, PieChart } from "lucide-react";
import type { FinancePageData } from "@/features/finance/actions";
import { CreateEntryDialog } from "./create-entry-dialog";
import { LedgerTable } from "./ledger-table";

interface FinanceViewProps {
  data: FinancePageData;
}

export function FinanceView({ data }: FinanceViewProps) {
  const { entries, summary, vendors, projects, departments, isAdmin } = data;

  const executionRate =
    summary.totalBudget > 0
      ? Math.min(100, (summary.totalExpense / summary.totalBudget) * 100).toFixed(1)
      : summary.totalExpense > 0
      ? "100"
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="text-primary" size={22} />
            <span>회계 장부 및 예산 관리</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            학생회비, 사업비, 프로젝트별 지출 내역과 영수증 증빙을 투명하게 정리·관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreateEntryDialog vendors={vendors} projects={projects} departments={departments} />
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Current Balance */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">현재 잔액</span>
            <Wallet size={16} className="text-primary/70" />
          </div>
          <p
            className={`mt-2 text-xl font-bold font-mono ${
              summary.currentBalance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            ₩{summary.currentBalance.toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            총 수입 - 총 지출 기준
          </p>
        </div>

        {/* Total Income */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">총 수입</span>
            <ArrowUpRight size={16} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₩{summary.totalIncome.toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            총 {summary.incomeCount}건 입금
          </p>
        </div>

        {/* Total Expense */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">총 지출</span>
            <ArrowDownRight size={16} className="text-rose-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            ₩{summary.totalExpense.toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            총 {summary.expenseCount}건 집행
          </p>
        </div>

        {/* Budget Execution */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">예산 집행률</span>
            <PieChart size={16} className="text-blue-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-foreground flex items-baseline gap-1">
            <span>{executionRate}%</span>
            {summary.totalBudget > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                (책정 ₩{summary.totalBudget.toLocaleString("ko-KR")})
              </span>
            )}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Number(executionRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <LedgerTable
        entries={entries}
        vendors={vendors}
        projects={projects}
        departments={departments}
        isAdmin={isAdmin}
      />
    </div>
  );
}

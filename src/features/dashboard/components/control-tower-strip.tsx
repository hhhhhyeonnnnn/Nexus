"use client";

import Link from "next/link";
import {
  ShieldAlert,
  FileCheck2,
  Receipt,
  Ticket,
  Megaphone,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import type { ControlTowerMetrics } from "@/features/projects/actions";

interface ControlTowerStripProps {
  metrics: ControlTowerMetrics;
}

export function ControlTowerStrip({ metrics }: ControlTowerStripProps) {
  const hasAlerts =
    metrics.pendingApprovalsCount > 0 ||
    metrics.missingReceiptsCount > 0 ||
    metrics.pendingPetitionsCount > 0 ||
    metrics.openFormsCount > 0;

  const handleOpenAssistant = () => {
    window.dispatchEvent(new CustomEvent("open-assistant"));
  };

  return (
    <section aria-label="학생회 통합 관제탑" className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              학생회 실시간 관제탑 (Control Tower)
            </h2>
            <p className="text-[11px] text-muted-foreground">
              결재 대기, 증빙 서류 누락, 행사 접수 및 학생 건의 실시간 감지
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAssistant}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          <span>AI에게 종합 현황 브리핑 요청</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs">
        {/* Approvals alert */}
        {metrics.pendingApprovalsCount > 0 ? (
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/40 px-3 py-1.5 font-medium text-amber-700 dark:text-amber-300 hover:opacity-90 transition-opacity"
          >
            <FileCheck2 className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>결재 대기 <strong>{metrics.pendingApprovalsCount}건</strong></span>
            <ArrowRight className="size-3 opacity-60" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>대기 중 결재 없음</span>
          </span>
        )}

        {/* Missing receipt warning */}
        {metrics.missingReceiptsCount > 0 ? (
          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/40 px-3 py-1.5 font-medium text-rose-700 dark:text-rose-300 hover:opacity-90 transition-opacity"
          >
            <Receipt className="size-3.5 text-rose-600 dark:text-rose-400" />
            <span>영수증 미첨부 지출 <strong>{metrics.missingReceiptsCount}건</strong></span>
            <ArrowRight className="size-3 opacity-60" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>모든 지출 증빙 완료</span>
          </span>
        )}

        {/* Open event forms & submissions */}
        {metrics.openFormsCount > 0 ? (
          <Link
            href="/forms"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/40 px-3 py-1.5 font-medium text-sky-700 dark:text-sky-300 hover:opacity-90 transition-opacity"
          >
            <Ticket className="size-3.5 text-sky-600 dark:text-sky-400" />
            <span>진행 중 행사 신청 <strong>{metrics.openFormsCount}건</strong> (접수 {metrics.totalSubmissionsCount}명)</span>
            <ArrowRight className="size-3 opacity-60" />
          </Link>
        ) : null}

        {/* Pending petitions */}
        {metrics.pendingPetitionsCount > 0 ? (
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 dark:border-purple-900/50 dark:bg-purple-950/40 px-3 py-1.5 font-medium text-purple-700 dark:text-purple-300 hover:opacity-90 transition-opacity"
          >
            <Megaphone className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>미답변 학생 건의 <strong>{metrics.pendingPetitionsCount}건</strong></span>
            <ArrowRight className="size-3 opacity-60" />
          </Link>
        ) : null}

        {!hasAlerts && (
          <p className="text-xs text-muted-foreground py-0.5">
            현재 긴급 대응 및 대기 중인 이슈가 없습니다. 모든 부서가 정상 운영되고 있습니다.
          </p>
        )}
      </div>
    </section>
  );
}

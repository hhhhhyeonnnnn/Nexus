"use client";

import Link from "next/link";
import {
  Briefcase,
  AlertTriangle,
  UserX,
  FileCheck2,
  Receipt,
  Users,
  Folder,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import type { DepartmentHeadData } from "@/features/projects/actions";

function formatKRW(amount: number) {
  if (Math.abs(amount) >= 10_000) {
    const man = Math.round(amount / 1_000) / 10;
    return `${man.toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function DepartmentHeadView({ data }: { data: DepartmentHeadData }) {
  const dept = data.department;
  const metrics = data.departmentMetrics;

  const hasAlerts =
    metrics.overdueTasksCount > 0 ||
    metrics.dueSoonTasksCount > 0 ||
    metrics.unassignedTasksCount > 0 ||
    metrics.pendingApprovalsCount > 0 ||
    metrics.missingReceiptsCount > 0;

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              국장단 실무 관제
            </span>
            <span className="text-xs text-muted-foreground">“우리 국에서 지금 확인할 것”</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {dept?.name ? `${dept.name} ` : "소속 부서 "}운영 현황
          </h1>
          <p className="text-sm text-muted-foreground">
            부서원의 업무량을 조율하고, 마감 임박 업무와 1차 결재 요청 서류를 검토하세요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-assistant"))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          <span>AI 부서 현황 브리핑</span>
        </button>
      </div>

      {/* Department Control Tower Strip */}
      <section aria-label="부서 관제탑" className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              {dept?.name ?? "부서"} 긴급 점검 지표
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            총 지출 {formatKRW(metrics.totalExpenseAmount)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs">
          {/* Overdue / Due Soon Tasks */}
          {metrics.overdueTasksCount + metrics.dueSoonTasksCount > 0 ? (
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/40 px-3 py-1.5 font-medium text-amber-700 dark:text-amber-300 hover:opacity-90 transition-opacity"
            >
              <AlertTriangle className="size-3.5 text-amber-600" />
              <span>
                마감 임박/지연 업무{" "}
                <strong>{metrics.overdueTasksCount + metrics.dueSoonTasksCount}건</strong>
              </span>
              <ArrowRight className="size-3 opacity-60" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>업무 지연 없음</span>
            </span>
          )}

          {/* Unassigned Tasks */}
          {metrics.unassignedTasksCount > 0 ? (
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 dark:border-purple-900/50 dark:bg-purple-950/40 px-3 py-1.5 font-medium text-purple-700 dark:text-purple-300 hover:opacity-90 transition-opacity"
            >
              <UserX className="size-3.5 text-purple-600" />
              <span>
                미배정 업무 <strong>{metrics.unassignedTasksCount}건</strong>
              </span>
              <ArrowRight className="size-3 opacity-60" />
            </Link>
          ) : null}

          {/* Pending Approvals */}
          {metrics.pendingApprovalsCount > 0 ? (
            <Link
              href="/approvals"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40 px-3 py-1.5 font-medium text-blue-700 dark:text-blue-300 hover:opacity-90 transition-opacity"
            >
              <FileCheck2 className="size-3.5 text-blue-600" />
              <span>
                검토 대기 결재 <strong>{metrics.pendingApprovalsCount}건</strong>
              </span>
              <ArrowRight className="size-3 opacity-60" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>대기 결재 없음</span>
            </span>
          )}

          {/* Missing Receipts */}
          {metrics.missingReceiptsCount > 0 ? (
            <Link
              href="/finance"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/40 px-3 py-1.5 font-medium text-rose-700 dark:text-rose-300 hover:opacity-90 transition-opacity"
            >
              <Receipt className="size-3.5 text-rose-600" />
              <span>
                미증빙 영수증 <strong>{metrics.missingReceiptsCount}건</strong>
              </span>
              <ArrowRight className="size-3 opacity-60" />
            </Link>
          ) : null}

          {!hasAlerts && (
            <span className="text-xs text-muted-foreground py-0.5">
              현재 부서 내 지연 업무나 미승인 결재가 없습니다.
            </span>
          )}
        </div>
      </section>

      {/* Grid: Workload & Department Projects */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,680fr)_minmax(0,440fr)]">
        {/* Workload balancing by member */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <CardTitle>부서원별 업무 배분 현황</CardTitle>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {data.departmentMembers.length}명
                </span>
              </div>
              <Link href="/members" className="text-xs text-primary hover:underline">
                부서원 관리 →
              </Link>
            </div>

            {data.departmentMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                부서에 등록된 구성원이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.departmentMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {member.name}
                        </span>
                        {member.jobTitle && (
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground font-medium">
                            {member.jobTitle}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>진행 중: <strong>{member.ongoingTasksCount}건</strong></span>
                        <span>완료: {member.doneTasksCount}건</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {member.ongoingTasksCount >= 4 ? (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          과부하 주의
                        </span>
                      ) : member.ongoingTasksCount === 0 ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          업무 여유
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          적정 배분
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Department Tasks */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>우리 국 최근 업무</CardTitle>
              <Link href="/tasks" className="text-xs text-primary hover:underline">
                전체보기 →
              </Link>
            </div>

            {data.departmentTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                등록된 부서 업무가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.departmentTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 px-1 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-foreground truncate">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        담당: {t.assigneeName || "미배정"}
                        {t.due_date && ` · 마감: ${t.due_date}`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Projects & Department Info */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>부서 연계 프로젝트</CardTitle>
              <Link href="/projects" className="text-xs text-primary hover:underline">
                전체보기 →
              </Link>
            </div>

            {data.departmentProjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                진행 중인 부서 프로젝트가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.departmentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <Folder className="size-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${p.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {p.progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Links Card */}
          <Card className="bg-muted/30">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              국장 전용 바로가기
            </CardTitle>
            <div className="mt-3 space-y-2 text-xs">
              <Link
                href="/approvals"
                className="flex items-center justify-between p-2 rounded-md bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <span>전자결재 1차 검토 및 상신</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/finance"
                className="flex items-center justify-between p-2 rounded-md bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <span>부서 지출 장부 및 영수증 승인</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/community"
                className="flex items-center justify-between p-2 rounded-md bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <span>부서 공지 작성 및 발송</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

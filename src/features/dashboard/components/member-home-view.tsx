"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Square,
  CalendarDays,
  Folder,
  Receipt,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Megaphone,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { updateTaskStatus, type TaskStatus } from "@/features/tasks/actions";
import type { MemberHomeData } from "@/features/projects/actions";

function formatKRW(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  return `${days}일 전`;
}

export function MemberHomeView({ data }: { data: MemberHomeData }) {
  const [isPending, startTransition] = useTransition();

  const handleToggleTask = (taskId: string, currentStatus: string, projectId?: string | null) => {
    const nextStatus: TaskStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    startTransition(async () => {
      await updateTaskStatus(taskId, nextStatus, projectId);
    });
  };

  const pendingTasks = data.myTasks.filter((t) => t.status !== "DONE");
  const completedTasks = data.myTasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      {/* Member Focus Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              오늘의 업무 집중 뷰
            </span>
            <span className="text-xs text-muted-foreground">“오늘 내가 뭐 해야 하지?”</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            오늘 해야 할 일 <span className="text-primary">{pendingTasks.length}건</span>이 있습니다
          </h1>
          <p className="text-sm text-muted-foreground">
            나에게 배정된 업무를 확인하고, 완료 시 체크박스를 눌러 즉시 진행 상태를 업데이트하세요.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <Receipt className="size-3.5 text-green-600" />
            <span>내 지출·영수증</span>
          </Link>
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <FileCheck2 className="size-3.5 text-blue-600" />
            <span>내 결재함</span>
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-assistant"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>AI 비서에게 묻기</span>
          </button>
        </div>
      </div>

      {/* Main Focus Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,720fr)_minmax(0,408fr)]">
        {/* Left Column: My Tasks First */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CardTitle>나에게 배정된 업무</CardTitle>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {pendingTasks.length}
                </span>
              </div>
              <Link href="/tasks" className="text-xs text-primary hover:underline">
                전체 업무 화면 →
              </Link>
            </div>

            {data.myTasks.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center py-8">
                <CheckCircle2 className="size-10 text-emerald-500/60" />
                <p className="text-sm font-medium text-foreground">배정된 업무가 없습니다</p>
                <p className="text-xs text-muted-foreground">
                  오늘 처리해야 할 급한 업무가 모두 완료되었거나 아직 배정되지 않았습니다.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors group"
                  >
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleTask(task.id, task.status, task.project_id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="업무 완료 처리"
                    >
                      <Square className="size-5" />
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {task.projectName && (
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[11px] font-medium text-foreground">
                            {task.projectName}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="size-3" />
                            마감: {task.due_date}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          [{task.status}]
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {completedTasks.length > 0 && (
                  <div className="pt-3">
                    <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground">
                      완료된 업무 ({completedTasks.length}건)
                    </p>
                    {completedTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 py-2 px-1 text-xs text-muted-foreground opacity-60"
                      >
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleTask(task.id, task.status, task.project_id)}
                          className="hover:text-foreground cursor-pointer"
                        >
                          <CheckSquare className="size-4 text-emerald-500" />
                        </button>
                        <span className="line-through truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* My Projects */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>내가 참여 중인 프로젝트</CardTitle>
              <Link href="/projects" className="text-xs text-primary hover:underline">
                전체보기 →
              </Link>
            </div>

            {data.myProjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                참여 중인 프로젝트가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.myProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-4">
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
        </div>

        {/* Right Column: Schedule, Announcements & Expenses */}
        <div className="space-y-6">
          {/* Today & Upcoming Events */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>이번 주 일정</CardTitle>
              <Link href="/calendar" className="text-xs text-primary hover:underline">
                캘린더 열기 →
              </Link>
            </div>

            {data.todayEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                예정된 일정이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.todayEvents.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 py-2.5 px-1">
                    <CalendarDays className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{evt.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(evt.start_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Important Announcements */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>학생회 공지</CardTitle>
              <Link href="/community" className="text-xs text-primary hover:underline">
                소통 허브 →
              </Link>
            </div>

            {data.recentAnnouncements.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                등록된 공지사항이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.recentAnnouncements.map((anno) => (
                  <Link
                    key={anno.id}
                    href="/community"
                    className="flex items-start gap-2.5 py-2.5 px-1 hover:bg-muted/30 rounded-md transition-colors"
                  >
                    <Megaphone className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground line-clamp-1">
                        {anno.is_pinned && "📌 "}
                        {anno.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(anno.created_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* My Recent Expenses */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>내 지출 내역</CardTitle>
              <Link href="/finance" className="text-xs text-primary hover:underline">
                회계 장부 →
              </Link>
            </div>

            {data.myRecentBudgets.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                제출한 지출 내역이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.myRecentBudgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 px-1 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-foreground truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">{b.transaction_date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">{formatKRW(b.actual_amount)}</p>
                      <span
                        className={`text-[9px] font-bold ${
                          b.receipt_url ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {b.receipt_url ? "✓ 증빙완료" : "⚠ 무증빙"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

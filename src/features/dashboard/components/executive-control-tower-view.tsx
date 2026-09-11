"use client";

import Link from "next/link";
import {
  CheckSquare,
  Folder,
  CalendarDays,
  Gavel,
  ListChecks,
  Receipt,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { ProjectStatusChip } from "@/features/projects/components/project-status-chip";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { ControlTowerStrip } from "@/features/dashboard/components/control-tower-strip";
import { TaskItem } from "@/features/tasks/components/task-item";
import type {
  ControlTowerMetrics,
  ActivityItem,
  CurrentUserOrganization,
  ProjectStatus,
} from "@/features/projects/actions";
import type { TaskWithDetails } from "@/features/tasks/actions";
import type {
  DashboardMeetingSummary,
  DashboardDecisionSummary,
} from "@/features/meetings/actions";

function formatKRW(amount: number) {
  if (Math.abs(amount) >= 10_000) {
    const man = Math.round(amount / 1_000) / 10;
    return `${man.toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const activityIconMap: Record<ActivityItem["type"], React.ReactNode> = {
  task: <ListChecks className="size-4 text-blue-500" />,
  meeting: <FileText className="size-4 text-purple-500" />,
  decision: <Gavel className="size-4 text-amber-500" />,
  budget: <Receipt className="size-4 text-green-500" />,
};

const activityLabelMap: Record<ActivityItem["type"], string> = {
  task: "업무",
  meeting: "회의록",
  decision: "결정사항",
  budget: "회계",
};

export interface ExecutiveControlTowerProps {
  projectSummaries: {
    inProgressCount: number;
    totalCount: number;
    recentProjects: Array<{
      id: string;
      name: string;
      description?: string | null;
      status: ProjectStatus;
    }>;
  };
  taskSummaries: {
    dueSoonCount: number;
    unassignedCount: number;
    urgentTasks: TaskWithDetails[];
  };
  budgetSummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  meetingSummaries: {
    thisWeekMeetings: DashboardMeetingSummary[];
    recentDecisions: DashboardDecisionSummary[];
  };
  activityFeed: ActivityItem[];
  controlTowerMetrics: ControlTowerMetrics;
  membership: CurrentUserOrganization | null;
}

export function ExecutiveControlTowerView({
  projectSummaries,
  taskSummaries,
  budgetSummary,
  meetingSummaries,
  activityFeed,
  controlTowerMetrics,
  membership,
}: ExecutiveControlTowerProps) {
  const orgName = membership?.organization.name ?? "학생회 워크스페이스";
  const balancePositive = budgetSummary.balance >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              회장단 총괄 관제탑
            </span>
            <span className="text-xs text-muted-foreground">Nexus Control Tower</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">학생회의 다음을 연결하는 공간</h1>
          <p className="text-sm text-muted-foreground">
            {orgName}에 오신 것을 환영해요. 전체 학생회 리스크와 현황을 한눈에 관제하세요.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Control Tower Strip */}
      <ControlTowerStrip metrics={controlTowerMetrics} />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <h2 className="text-xs text-muted-foreground">진행 중 프로젝트</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {projectSummaries.inProgressCount}
            <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
          </p>
          <p className="mt-1 text-xs text-primary hover:underline">
            <Link href="/projects?status=IN_PROGRESS">프로젝트 목록 보기 →</Link>
          </p>
        </Card>

        <Card>
          <h2 className="text-xs text-muted-foreground">3일 이내 마감</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {taskSummaries.dueSoonCount}
            <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
          </p>
          <p className="mt-1 text-xs text-primary hover:underline">
            <Link href="/tasks">업무 목록 보기 →</Link>
          </p>
        </Card>

        <Card>
          <h2 className="text-xs text-muted-foreground">담당자 없는 업무</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {taskSummaries.unassignedCount}
            <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
          </p>
          <p className="mt-1 text-xs text-primary hover:underline">
            <Link href="/tasks">업무 배정하기 →</Link>
          </p>
        </Card>

        <Card>
          <h2 className="text-xs text-muted-foreground">현재 잔액</h2>
          <p className={`mt-2 text-2xl font-bold ${balancePositive ? "text-foreground" : "text-destructive"}`}>
            {formatKRW(budgetSummary.balance)}
          </p>
          <p className="mt-1 text-xs text-primary hover:underline">
            <Link href="/finance">회계 장부 보기 →</Link>
          </p>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,720fr)_minmax(0,408fr)]">
        <div className="space-y-6">
          {/* Ongoing Projects Section */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>진행 중 프로젝트</CardTitle>
              <Link href="/projects" className="text-xs text-primary hover:underline">
                전체보기 →
              </Link>
            </div>

            {projectSummaries.recentProjects.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center py-6">
                <Folder className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">학생회의 새로운 프로젝트를 기다리고 있어요.</p>
                <p className="text-xs text-muted-foreground">행사별 업무와 기록이 이곳에 모여요.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {projectSummaries.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-md transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {project.description}
                        </div>
                      )}
                    </div>
                    <ProjectStatusChip status={project.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Urgent Tasks Section */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>지금 챙겨야 할 일</CardTitle>
              <Link href="/tasks" className="text-xs text-primary hover:underline">
                전체 업무 보기 →
              </Link>
            </div>

            {taskSummaries.urgentTasks.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center py-6">
                <CheckSquare className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">지금 당장 마감 임박한 업무가 없습니다.</p>
                <p className="text-xs text-muted-foreground">새로운 업무를 등록하여 협업을 진행해 보세요.</p>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {taskSummaries.urgentTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* This week's meetings */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>이번 주 회의</CardTitle>
              <Link href="/meetings" className="text-xs text-primary hover:underline">
                전체보기 →
              </Link>
            </div>

            {meetingSummaries.thisWeekMeetings.length === 0 ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1 text-center py-6">
                <CalendarDays className="size-6 text-muted-foreground/40 mb-1" />
                <p className="text-sm text-muted-foreground">이번 주 예정된 회의가 없어요.</p>
              </div>
            ) : (
              <div className="mt-1 divide-y divide-border/60">
                {meetingSummaries.thisWeekMeetings.map((m) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="flex items-start gap-3 py-3 px-1 hover:bg-muted/30 rounded-md transition-colors"
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="size-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.meetingDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                        {m.projectName && ` · ${m.projectName}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recent decisions */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>최근 결정사항</CardTitle>
              <Link href="/meetings" className="text-xs text-primary hover:underline">
                전체보기 →
              </Link>
            </div>

            {meetingSummaries.recentDecisions.length === 0 ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1 text-center py-6">
                <Gavel className="size-6 text-muted-foreground/40 mb-1" />
                <p className="text-sm text-muted-foreground">기록된 결정사항이 없어요.</p>
              </div>
            ) : (
              <div className="mt-1 divide-y divide-border/60">
                {meetingSummaries.recentDecisions.map((d) => (
                  <div key={d.id} className="py-2.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <Gavel className="size-3.5 text-amber-500 shrink-0" />
                      <p className="text-sm font-medium text-foreground line-clamp-1">{d.title}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 pl-5">
                      {d.content}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70 pl-5">
                      {d.decidedAt
                        ? new Date(d.decidedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
                        : "일자 미정"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Activity feed */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardTitle>최근 활동 기록</CardTitle>
            </div>

            {activityFeed.length === 0 ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1 text-center py-6">
                <Clock className="size-6 text-muted-foreground/40 mb-1" />
                <p className="text-sm text-muted-foreground">최근 활동 기록이 없어요.</p>
              </div>
            ) : (
              <div className="mt-1 divide-y divide-border/60">
                {activityFeed.map((item, idx) => (
                  <Link
                    key={`${item.type}-${item.createdAt}-${idx}`}
                    href={item.href}
                    className="flex items-start gap-3 py-2.5 px-1 rounded-md transition-colors hover:bg-muted/40"
                  >
                    <div className="mt-0.5 shrink-0">
                      {activityIconMap[item.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          [{activityLabelMap[item.type]}]
                        </span>
                        <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {timeAgo(item.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

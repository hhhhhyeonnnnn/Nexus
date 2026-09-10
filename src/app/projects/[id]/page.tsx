import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckSquare, Clock, Receipt } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProjectById, getCurrentUserOrganization, getProjectBudgetSummary } from "@/features/projects/actions";
import { getTasks, getOrganizationMembersList } from "@/features/tasks/actions";
import { ProjectStatusChip } from "@/features/projects/components/project-status-chip";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { DeleteProjectButton } from "@/features/projects/components/delete-project-button";
import { TaskItem } from "@/features/tasks/components/task-item";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";

export const metadata: Metadata = {
  title: "프로젝트 상세",
};

export const dynamic = "force-dynamic";

function formatKRW(amount: number) {
  if (Math.abs(amount) >= 10_000) {
    const man = Math.round(amount / 1_000) / 10;
    return `${man.toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, membership, tasks, members, budgetSummary] = await Promise.all([
    getProjectById(id),
    getCurrentUserOrganization(),
    getTasks({ projectId: id }),
    getOrganizationMembersList(),
    getProjectBudgetSummary(id),
  ]);

  if (!project) {
    notFound();
  }

  const isManager = membership ? ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role) : false;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const start = formatDate(project.start_date);
  const end = formatDate(project.end_date);
  const dateRange = start && end ? `${start} ~ ${end}` : start ? `${start} ~` : end ? `~ ${end}` : "기간 미설정";

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const taskProgressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const hasBudget = budgetSummary.plannedAmount > 0 || budgetSummary.actualAmount > 0;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>전체 프로젝트 목록으로</span>
        </Link>
      </div>

      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <ProjectStatusChip status={project.status} />
          </div>
          {project.description ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">등록된 설명이 없습니다.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <EditProjectDialog project={project} />
          <DeleteProjectButton projectId={project.id} isManager={isManager} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">진행 기간</div>
            <div className="text-sm font-semibold text-foreground">{dateRange}</div>
          </div>
        </Card>

        <Card className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CheckSquare className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">업무 완료율</div>
              <div className="text-sm font-semibold text-foreground">
                {totalTasks > 0 ? `${doneTasks} / ${totalTasks} 완료 (${taskProgressPct}%)` : "0개 등록됨"}
              </div>
            </div>
          </div>
          {totalTasks > 0 && (
            <Progress value={taskProgressPct} aria-label={`업무 완료율 ${taskProgressPct}%`} />
          )}
        </Card>

        {hasBudget ? (
          <Card className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                <Receipt className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">예산 집행률</div>
                <div className="text-sm font-semibold text-foreground">
                  {formatKRW(budgetSummary.actualAmount)} / {formatKRW(budgetSummary.plannedAmount)}
                </div>
              </div>
            </div>
            <Progress
              value={budgetSummary.executionRate}
              className="[&>div]:bg-green-500"
              aria-label={`예산 집행률 ${Math.round(budgetSummary.executionRate)}%`}
            />
          </Card>
        ) : (
          <Card className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <Receipt className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">예산 집행률</div>
              <div className="text-sm text-muted-foreground/60 italic">예산 미등록</div>
            </div>
          </Card>
        )}

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">생성일</div>
            <div className="text-sm font-semibold text-foreground">
              {new Date(project.created_at).toLocaleDateString("ko-KR")}
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks live section */}
      <Card>
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <CardTitle>프로젝트 업무 목록 ({tasks.length})</CardTitle>
          <CreateTaskDialog
            members={members}
            defaultProjectId={project.id}
            buttonLabel="업무 추가"
          />
        </div>

        {tasks.length === 0 ? (
          <div className="mt-4 flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center">
            <CheckSquare className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              아직 이 프로젝트에 등록된 업무가 없습니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              우측 상단의 &apos;업무 추가&apos; 버튼을 눌러 첫 번째 할 일을 배정해 보세요.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} showProject={false} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { getTasks, getOrganizationMembersList } from "@/features/tasks/actions";
import { getProjects } from "@/features/projects/actions";
import { TaskItem } from "@/features/tasks/components/task-item";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { TaskFilterTabs } from "@/features/tasks/components/task-filter-tabs";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "업무 관리",
};

export const dynamic = "force-dynamic";

type TaskStatus = Database["public"]["Enums"]["task_status"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; projectId?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as TaskStatus | undefined;

  const [tasks, projects, members] = await Promise.all([
    getTasks({ status: statusFilter, projectId: params.projectId }),
    getProjects("ALL"),
    getOrganizationMembersList(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">업무 관리</h1>
          <p className="text-sm text-muted-foreground">
            학생회의 실행 업무를 담당자별, 마감일별로 한눈에 파악하고 챙기세요.
          </p>
        </div>
        <CreateTaskDialog projects={projects} members={members} />
      </div>

      {/* Filter Tabs */}
      <TaskFilterTabs />

      {/* Task List / Empty State */}
      {tasks.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CheckSquare className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">등록된 업무가 없습니다</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {statusFilter
              ? "해당 상태의 업무가 없습니다. 다른 필터를 선택하거나 새 업무를 등록해 보세요."
              : "새로운 업무를 등록하고 담당자를 지정하여 협업을 시작하세요."}
          </p>
          <div className="mt-4">
            <CreateTaskDialog projects={projects} members={members} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

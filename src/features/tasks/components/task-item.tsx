"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Calendar, Trash2, User } from "lucide-react";
import { TaskStatusChip } from "@/features/tasks/components/task-status-chip";
import { updateTaskStatus, deleteTask, type TaskWithDetails } from "@/features/tasks/actions";
import { getDepartmentColorClasses } from "@/features/departments/utils";

export function TaskItem({
  task,
  showProject = true,
}: {
  task: TaskWithDetails;
  showProject?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "DONE";

  const handleToggle = () => {
    const nextStatus = isDone ? "TODO" : "DONE";
    startTransition(async () => {
      await updateTaskStatus(task.id, nextStatus, task.project_id);
    });
  };

  const handleDelete = () => {
    if (!confirm("이 업무를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteTask(task.id, task.project_id);
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "numeric",
      day: "numeric",
    });
  };

  const isDueOver = !isDone && task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:bg-muted/30 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isDone}
          onChange={handleToggle}
          disabled={isPending}
          className="size-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
          aria-label={`${task.title} 완료 상태 변경`}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium text-foreground transition-all line-clamp-1 ${
                isDone ? "line-through text-muted-foreground/70" : ""
              }`}
            >
              {task.title}
            </span>
            <TaskStatusChip status={task.status} />
            {task.departments && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium border ${
                  getDepartmentColorClasses(task.departments.color).badge
                }`}
              >
                {task.departments.name}
              </span>
            )}
            {showProject && task.projects && (
              <Link
                href={`/projects/${task.projects.id}`}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {task.projects.name}
              </Link>
            )}
          </div>

          {task.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        {task.due_date && (
          <div
            className={`flex items-center gap-1 ${
              isDueOver ? "text-destructive font-medium" : ""
            }`}
          >
            <Calendar className="size-3.5" />
            <span>{formatDate(task.due_date)} {isDueOver && "지남"}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <User className="size-3.5" />
          <span>{task.assigneeName ?? "미지정"}</span>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
          title="업무 삭제"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

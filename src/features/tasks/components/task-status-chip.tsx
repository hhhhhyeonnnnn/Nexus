import { StatusChip } from "@/components/common/status-chip";
import type { Database } from "@/types/database";

type TaskStatus = Database["public"]["Enums"]["task_status"];

const STATUS_MAP: Record<TaskStatus, { label: string; tone: "neutral" | "accent" | "outline" }> = {
  TODO: { label: "대기", tone: "neutral" },
  IN_PROGRESS: { label: "진행 중", tone: "accent" },
  REVIEW: { label: "검토", tone: "accent" },
  DONE: { label: "완료", tone: "outline" },
};

export function TaskStatusChip({ status }: { status: TaskStatus }) {
  const meta = STATUS_MAP[status] ?? { label: status, tone: "neutral" };
  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
}

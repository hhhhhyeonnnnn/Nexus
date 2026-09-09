import { StatusChip } from "@/components/common/status-chip";
import type { Database } from "@/types/database";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const STATUS_MAP: Record<ProjectStatus, { label: string; tone: "neutral" | "accent" | "outline" }> = {
  PLANNED: { label: "계획됨", tone: "neutral" },
  IN_PROGRESS: { label: "진행 중", tone: "accent" },
  COMPLETED: { label: "완료됨", tone: "outline" },
  ARCHIVED: { label: "보관됨", tone: "neutral" },
};

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const meta = STATUS_MAP[status] ?? { label: status, tone: "neutral" };
  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
}

import Link from "next/link";
import { Calendar, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusChip } from "@/features/projects/components/project-status-chip";
import type { Database } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  tasks?: { id: string; status: string }[];
};

export function ProjectCard({ project }: { project: Project }) {
  const totalTasks = project.tasks?.length ?? 0;
  const completedTasks = project.tasks?.filter((t) => t.status === "DONE").length ?? 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  const start = formatDate(project.start_date);
  const end = formatDate(project.end_date);
  const dateRange = start && end ? `${start} ~ ${end}` : start ? `${start} ~` : end ? `~ ${end}` : null;

  return (
    <Link href={`/projects/${project.id}`} className="group block focus-visible:outline-none">
      <Card className="flex h-full flex-col justify-between transition-all group-hover:border-primary/50 group-hover:shadow-sm">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {project.name}
            </h3>
            <ProjectStatusChip status={project.status} />
          </div>

          {project.description ? (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground/60 italic">
              설명이 없습니다
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2.5 border-t border-border/50 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{dateRange ?? "기간 미정"}</span>
            </div>

            <div className="flex items-center gap-1">
              <CheckSquare className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {totalTasks > 0 ? `${completedTasks}/${totalTasks} 완료` : "업무 없음"}
              </span>
            </div>
          </div>

          {totalTasks > 0 && (
            <Progress value={progressPct} aria-label={`업무 완료율 ${progressPct}%`} />
          )}
        </div>
      </Card>
    </Link>
  );
}

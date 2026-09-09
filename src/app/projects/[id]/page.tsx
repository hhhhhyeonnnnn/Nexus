import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckSquare, Clock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { getProjectById, getCurrentUserOrganization } from "@/features/projects/actions";
import { ProjectStatusChip } from "@/features/projects/components/project-status-chip";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { DeleteProjectButton } from "@/features/projects/components/delete-project-button";

export const metadata: Metadata = {
  title: "프로젝트 상세",
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, membership] = await Promise.all([
    getProjectById(id),
    getCurrentUserOrganization(),
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

  const totalTasks = project.tasks?.length ?? 0;
  const doneTasks = project.tasks?.filter((t: { status: string }) => t.status === "DONE").length ?? 0;

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">진행 기간</div>
            <div className="text-sm font-semibold text-foreground">{dateRange}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <CheckSquare className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">연관된 업무 (Tasks)</div>
            <div className="text-sm font-semibold text-foreground">
              {totalTasks > 0 ? `${doneTasks} / ${totalTasks} 완료` : "0개 등록됨"}
            </div>
          </div>
        </Card>

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

      {/* Tasks placeholder section for next issue */}
      <Card>
        <CardTitle>프로젝트 업무 목록</CardTitle>
        <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            프로젝트에 등록된 업무(Task)를 불러오는 중이거나 아직 등록된 업무가 없습니다.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            다음 작업(Task 도메인 구축)에서 업무 배정 및 체크리스트 기능이 연결될 예정입니다.
          </p>
        </div>
      </Card>
    </div>
  );
}

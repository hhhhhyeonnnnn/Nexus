import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Folder } from "lucide-react";
import { getProjects, getCurrentUserOrganization } from "@/features/projects/actions";
import { ProjectCard } from "@/features/projects/components/project-card";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { ProjectFilterTabs } from "@/features/projects/components/project-filter-tabs";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "프로젝트 관리",
};

export const dynamic = "force-dynamic";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const statusFilter = params.status as ProjectStatus | undefined;
  const projects = await getProjects(statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">프로젝트 관리</h1>
          <p className="text-sm text-muted-foreground">
            학생회의 축제, 행사, 복지 사업 등 모든 프로젝트를 한곳에서 관리하세요.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Filter Tabs */}
      <ProjectFilterTabs />

      {/* Projects Grid / Empty State */}
      {projects.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Folder className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">등록된 프로젝트가 없습니다</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {statusFilter
              ? "해당 상태의 프로젝트가 없습니다. 다른 필터를 선택하거나 새 프로젝트를 생성해 보세요."
              : "새로운 학생회 프로젝트를 등록하고 업무와 일정을 체계적으로 관리해 보세요."}
          </p>
          <div className="mt-4">
            <CreateProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Folder, Sparkles } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/common/status-chip";
import { ProjectStatusChip } from "@/features/projects/components/project-status-chip";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import {
  getDashboardProjectSummaries,
  getCurrentUserOrganization,
} from "@/features/projects/actions";

export const metadata: Metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summaries, membership] = await Promise.all([
    getDashboardProjectSummaries(),
    getCurrentUserOrganization(),
  ]);

  const orgName = membership?.organization.name ?? "학생회 워크스페이스";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">학생회의 다음을 연결하는 공간</h1>
          <p className="text-sm text-muted-foreground">
            {orgName}에 오신 것을 환영해요. 오늘도 협업을 원활하게 진행해 보세요.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <h2 className="text-xs text-muted-foreground">진행 중 프로젝트</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {summaries.inProgressCount}
            <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
          </p>
          <p className="mt-1 text-xs text-primary hover:underline">
            <Link href="/projects?status=IN_PROGRESS">프로젝트 목록 보기 →</Link>
          </p>
        </Card>

        <Card>
          <h2 className="text-xs text-muted-foreground">3일 이내 마감</h2>
          <p className="mt-2 text-2xl" aria-label="데이터 미연결">—</p>
          <p className="mt-1 text-xs text-muted-foreground">업무 도메인 연결 준비 중</p>
        </Card>

        <Card>
          <h2 className="text-xs text-muted-foreground">담당자 없는 업무</h2>
          <p className="mt-2 text-2xl" aria-label="데이터 미연결">—</p>
          <p className="mt-1 text-xs text-muted-foreground">업무 도메인 연결 준비 중</p>
        </Card>

        <Card>
          <h2 className="text-xs text-muted-foreground">예산 확인 필요</h2>
          <p className="mt-2 text-2xl" aria-label="데이터 미연결">—</p>
          <p className="mt-1 text-xs text-muted-foreground">예산 도메인 연결 준비 중</p>
        </Card>
      </div>

      {/* Banner */}
      <div className="flex items-center gap-4 rounded-lg bg-accent p-5">
        <Sparkles size={22} className="shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium text-primary">업무와 기록을 한곳에서</p>
          <p className="text-xs text-muted-foreground">
            프로젝트, 회의, 결정사항이 연결되면 오늘 필요한 맥락을 함께 볼 수 있어요.
          </p>
        </div>
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

            {summaries.recentProjects.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center py-6">
                <Folder className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">학생회의 새로운 프로젝트를 기다리고 있어요.</p>
                <p className="text-xs text-muted-foreground">행사별 업무와 기록이 이곳에 모여요.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {summaries.recentProjects.map((project) => (
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

          {/* Tasks Placeholder */}
          <Card>
            <CardTitle>지금 챙겨야 할 일</CardTitle>
            <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
              <p className="text-muted-foreground">업무를 함께 챙길 준비를 하고 있어요.</p>
              <p className="text-xs text-muted-foreground">담당자와 마감일을 한눈에 확인할 수 있어요.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle>이번 주 회의</CardTitle>
            <p className="py-8 text-center text-muted-foreground text-sm">
              회의 일정 연결을 준비하고 있어요.
            </p>
          </Card>
          <Card>
            <CardTitle>최근 결정사항</CardTitle>
            <p className="py-8 text-center text-muted-foreground text-sm">
              회의에서 결정한 내용을 모아볼 수 있어요.
            </p>
            <StatusChip tone="outline">연결 준비 중</StatusChip>
          </Card>
        </div>
      </div>
    </div>
  );
}

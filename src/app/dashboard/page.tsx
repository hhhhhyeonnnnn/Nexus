import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";

export const metadata: Metadata = { title: "대시보드" };

const summaries = ["진행 중 프로젝트", "3일 이내 마감", "담당자 없는 업무", "예산 확인 필요"];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1"><h1 className="text-2xl font-bold">학생회의 다음을 연결하는 공간</h1><p className="text-muted-foreground">Nexus에 오신 것을 환영해요. 워크스페이스를 준비하고 있어요.</p></div>
        <Button disabled title="프로젝트 생성 기능은 준비 중입니다">새 프로젝트</Button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaries.map((label) => <Card key={label}><h2 className="text-xs text-muted-foreground">{label}</h2><p className="mt-2 text-2xl" aria-label="데이터 미연결">—</p><p className="mt-1 text-xs text-muted-foreground">연결 후 확인할 수 있어요</p></Card>)}
      </div>
      <div className="flex items-center gap-4 rounded-lg bg-accent p-5">
        <Sparkles size={22} className="shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1"><p className="font-medium text-primary">업무와 기록을 한곳에서</p><p>프로젝트, 회의, 결정사항이 연결되면 오늘 필요한 맥락을 함께 볼 수 있어요.</p></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,720fr)_minmax(0,408fr)]">
        <div className="space-y-6">
          <Card><CardTitle>지금 챙겨야 할 일</CardTitle><div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center"><p className="text-muted-foreground">업무를 함께 챙길 준비를 하고 있어요.</p><p className="text-xs text-muted-foreground">담당자와 마감일을 한눈에 확인할 수 있어요.</p></div></Card>
          <Card><CardTitle>진행 중 프로젝트</CardTitle><div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center"><p className="text-muted-foreground">학생회의 새로운 프로젝트를 기다리고 있어요.</p><p className="text-xs text-muted-foreground">행사별 업무와 기록이 이곳에 모여요.</p></div></Card>
        </div>
        <div className="space-y-6">
          <Card><CardTitle>이번 주 회의</CardTitle><p className="py-8 text-center text-muted-foreground">회의 일정 연결을 준비하고 있어요.</p></Card>
          <Card><CardTitle>최근 결정사항</CardTitle><p className="py-8 text-center text-muted-foreground">회의에서 결정한 내용을 모아볼 수 있어요.</p><StatusChip tone="outline">연결 준비 중</StatusChip></Card>
        </div>
      </div>
    </div>
  );
}

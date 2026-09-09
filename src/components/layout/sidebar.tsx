import Link from "next/link";
import { CalendarDays, FileText, Folder, LayoutGrid, ListChecks, Search, Sparkles, Users } from "lucide-react";
import { StatusChip } from "@/components/common/status-chip";

const upcomingNavigation = [
  { label: "프로젝트", icon: Folder },
  { label: "업무 관리", icon: ListChecks },
  { label: "캘린더", icon: CalendarDays },
  { label: "문서", icon: FileText },
  { label: "구성원·업체", icon: Users },
  { label: "AI 어시스턴트", icon: Sparkles },
];

export function Sidebar() {
  return (
    <div className="flex min-h-full flex-col gap-6 bg-sidebar px-4 pt-6 pb-5">
      <Link href="/dashboard" className="flex items-center gap-3" aria-label="Nexus 대시보드">
        <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">N</span>
        <span><span className="block font-medium">Nexus</span><span className="block text-xs text-muted-foreground">학생회 통합 운영 공간</span></span>
      </Link>
      <button type="button" disabled className="flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground" aria-label="빠른 검색, 준비 중">
        <Search size={16} aria-hidden="true" />빠른 검색<span className="ml-auto">준비 중</span>
      </button>
      <nav aria-label="주 메뉴" className="flex flex-col gap-1">
        <Link href="/dashboard" aria-current="page" className="flex h-9 items-center gap-3 rounded-md bg-accent px-2 font-medium text-accent-foreground"><LayoutGrid size={18} aria-hidden="true" />대시보드</Link>
        {upcomingNavigation.map(({ label, icon: Icon }) => (
          <button key={label} type="button" disabled className="flex h-9 items-center gap-3 rounded-md px-2 text-left font-medium text-muted-foreground" aria-label={`${label}, 준비 중`} title="준비 중">
            <Icon size={18} aria-hidden="true" />{label}
          </button>
        ))}
      </nav>
      <div className="space-y-3 text-xs text-muted-foreground"><p>즐겨찾는 프로젝트</p><p className="px-2 py-2">등록된 프로젝트가 없어요.</p></div>
      <div className="mt-auto space-y-6 pt-8">
        <div className="space-y-2 rounded-lg border bg-background p-3"><Sparkles size={18} className="text-primary" aria-hidden="true" /><p className="text-xs">기록이 다음의 시작이 되도록</p><p className="text-xs text-muted-foreground">학생회의 업무와 기억을 연결해요.</p></div>
        <div className="flex items-center gap-3"><span className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-border text-xs" aria-hidden="true">N</span><div><p className="text-xs">워크스페이스</p><StatusChip>연결 준비 중</StatusChip></div></div>
      </div>
    </div>
  );
}

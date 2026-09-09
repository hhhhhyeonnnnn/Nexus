"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FileText,
  Folder,
  LayoutGrid,
  ListChecks,
  Receipt,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { StatusChip } from "@/components/common/status-chip";
import { cn } from "@/lib/utils";

const upcomingNavigation = [
  { label: "문서 및 회의록", icon: FileText },
  { label: "AI 어시스턴트", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isProjects = pathname.startsWith("/projects");
  const isTasks = pathname.startsWith("/tasks");
  const isCalendar = pathname.startsWith("/calendar");
  const isFinance = pathname.startsWith("/finance");
  const isVendors = pathname.startsWith("/vendors");
  const isMembers = pathname.startsWith("/members");

  return (
    <div className="flex min-h-full flex-col gap-6 bg-sidebar px-4 pt-6 pb-5">
      <Link href="/dashboard" className="flex items-center gap-3" aria-label="Nexus 대시보드">
        <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
          N
        </span>
        <span>
          <span className="block font-medium">Nexus</span>
          <span className="block text-xs text-muted-foreground">학생회 통합 운영 공간</span>
        </span>
      </Link>

      <button
        type="button"
        disabled
        className="flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground"
        aria-label="빠른 검색, 준비 중"
      >
        <Search size={16} aria-hidden="true" />
        빠른 검색<span className="ml-auto text-xs">준비 중</span>
      </button>

      <nav aria-label="주 메뉴" className="flex flex-col gap-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isDashboard
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <LayoutGrid size={18} aria-hidden="true" />
          대시보드
        </Link>

        <Link
          href="/projects"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isProjects
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <Folder size={18} aria-hidden="true" />
          프로젝트
        </Link>

        <Link
          href="/tasks"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isTasks
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <ListChecks size={18} aria-hidden="true" />
          업무 관리
        </Link>

        <Link
          href="/calendar"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isCalendar
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <CalendarDays size={18} aria-hidden="true" />
          캘린더
        </Link>

        <Link
          href="/finance"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isFinance
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <Receipt size={18} aria-hidden="true" />
          회계 장부
        </Link>

        <Link
          href="/vendors"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isVendors
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <Building2 size={18} aria-hidden="true" />
          제휴·업체
        </Link>

        <Link
          href="/members"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isMembers
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <Users size={18} aria-hidden="true" />
          구성원
        </Link>

        {upcomingNavigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            className="flex h-9 items-center gap-3 rounded-md px-2 text-left text-sm font-medium text-muted-foreground/60 cursor-not-allowed"
            aria-label={`${label}, 준비 중`}
            title="준비 중"
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      <div className="space-y-3 text-xs text-muted-foreground">
        <p className="font-medium">바로가기</p>
        <Link href="/projects" className="block px-2 py-1 hover:underline text-foreground">
          프로젝트 관리 →
        </Link>
        <Link href="/tasks" className="block px-2 py-1 hover:underline text-foreground">
          전체 업무 관리 →
        </Link>
        <Link href="/calendar" className="block px-2 py-1 hover:underline text-foreground">
          학생회 캘린더 →
        </Link>
        <Link href="/finance" className="block px-2 py-1 hover:underline text-foreground">
          회계 장부 정리 →
        </Link>
        <Link href="/vendors" className="block px-2 py-1 hover:underline text-foreground">
          제휴·업체 관리 →
        </Link>
        <Link href="/members" className="block px-2 py-1 hover:underline text-foreground">
          구성원 및 신청 관리 →
        </Link>
      </div>

      <div className="mt-auto space-y-6 pt-8">
        <div className="space-y-2 rounded-lg border bg-background p-3">
          <Sparkles size={18} className="text-primary" aria-hidden="true" />
          <p className="text-xs font-medium">기록이 다음의 시작이 되도록</p>
          <p className="text-xs text-muted-foreground">학생회의 업무와 기억을 연결해요.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-border text-xs"
            aria-hidden="true"
          >
            N
          </span>
          <div>
            <p className="text-xs font-medium">학생회 워크스페이스</p>
            <StatusChip tone="accent">활성 상태</StatusChip>
          </div>
        </div>
      </div>
    </div>
  );
}

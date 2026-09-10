"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FileCheck2,
  FileText,
  Folder,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Receipt,
  Search,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { StatusChip } from "@/components/common/status-chip";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isProjects = pathname.startsWith("/projects");
  const isTasks = pathname.startsWith("/tasks");
  const isCalendar = pathname.startsWith("/calendar");
  const isMeetings = pathname.startsWith("/meetings");
  const isFinance = pathname.startsWith("/finance");
  const isVendors = pathname.startsWith("/vendors");
  const isMembers = pathname.startsWith("/members");
  const isForms = pathname.startsWith("/forms");
  const isApprovals = pathname.startsWith("/approvals");
  const isCommunity = pathname.startsWith("/community");

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
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        className="flex h-9 items-center gap-2 rounded-md border bg-background px-2.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
        aria-label="빠른 검색 (단축키: Cmd+K)"
      >
        <Search size={16} aria-hidden="true" />
        <span>빠른 검색</span>
        <span className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</span>
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
          href="/meetings"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isMeetings
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <FileText size={18} aria-hidden="true" />
          문서 및 회의록
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

        <Link
          href="/forms"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isForms
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <Ticket size={18} aria-hidden="true" />
          행사·부스 신청
        </Link>

        <Link
          href="/approvals"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isApprovals
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <FileCheck2 size={18} aria-hidden="true" />
          전자결재
        </Link>

        <Link
          href="/community"
          className={cn(
            "flex h-9 items-center gap-3 rounded-md px-2 font-medium transition-colors text-sm",
            isCommunity
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <Megaphone size={18} aria-hidden="true" />
          소통·피드
        </Link>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-assistant"))}
          className="flex h-9 items-center gap-3 rounded-md px-2 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Nexus AI 어시스턴트 열기"
        >
          <Sparkles size={18} className="text-primary shrink-0" aria-hidden="true" />
          <span>AI 어시스턴트</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            AI
          </span>
        </button>
      </nav>

      <div className="space-y-3 text-xs text-muted-foreground">
        <p className="font-medium">바로가기</p>
        <Link href="/projects" className="block px-2 py-1 hover:underline text-foreground">
          프로젝트 관리 →
        </Link>
        <Link href="/tasks" className="block px-2 py-1 hover:underline text-foreground">
          전체 업무 관리 →
        </Link>
        <Link href="/approvals" className="block px-2 py-1 hover:underline text-foreground">
          전자결재함 →
        </Link>
        <Link href="/community" className="block px-2 py-1 hover:underline text-foreground">
          소통·피드 관리 →
        </Link>
        <Link href="/forms" className="block px-2 py-1 hover:underline text-foreground">
          행사·티켓 관리 →
        </Link>
        <Link href="/calendar" className="block px-2 py-1 hover:underline text-foreground">
          학생회 캘린더 →
        </Link>
        <Link href="/meetings" className="block px-2 py-1 hover:underline text-foreground">
          회의록 및 결정사항 →
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

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FileCheck2,
  FileText,
  Folder,
  Home,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Receipt,
  Search,
  Settings,
  Sparkles,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoleContext } from "@/features/auth/role-context";
import { RoleViewSwitcher } from "@/features/dashboard/components/role-view-switcher";

interface NavItemDef {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isAction?: boolean;
}

// 1. 회장단 사이드바 (14개 항목)
const EXECUTIVE_NAV: NavItemDef[] = [
  { label: "Control Tower", href: "/dashboard", icon: LayoutGrid },
  { label: "조직 현황", href: "/members?tab=org-chart", icon: Users },
  { label: "전체 프로젝트", href: "/projects", icon: Folder },
  { label: "전체 업무", href: "/tasks", icon: ListChecks },
  { label: "전체 일정", href: "/calendar", icon: CalendarDays },
  { label: "전자결재", href: "/approvals", icon: FileCheck2 },
  { label: "전체 회계", href: "/finance", icon: Receipt },
  { label: "구성원 관리", href: "/members", icon: UserCheck },
  { label: "행사·부스", href: "/forms", icon: Ticket },
  { label: "제휴·업체", href: "/vendors", icon: Building2 },
  { label: "문서 및 회의록", href: "/meetings", icon: FileText },
  { label: "소통·피드", href: "/community", icon: Megaphone },
  { label: "AI 어시스턴트", href: "#", icon: Sparkles, isAction: true },
  { label: "조직 설정", href: "/admin", icon: Settings },
];

// 2. 국장단 사이드바 (12개 항목)
const HEAD_NAV: NavItemDef[] = [
  { label: "부서 대시보드", href: "/dashboard", icon: LayoutGrid },
  { label: "업무 관리", href: "/tasks", icon: ListChecks },
  { label: "프로젝트", href: "/projects", icon: Folder },
  { label: "캘린더", href: "/calendar", icon: CalendarDays },
  { label: "전자결재", href: "/approvals", icon: FileCheck2 },
  { label: "부서 회계", href: "/finance", icon: Receipt },
  { label: "부서원", href: "/members", icon: Users },
  { label: "행사·부스", href: "/forms", icon: Ticket },
  { label: "제휴·업체", href: "/vendors", icon: Building2 },
  { label: "문서 및 회의록", href: "/meetings", icon: FileText },
  { label: "소통·피드", href: "/community", icon: Megaphone },
  { label: "AI 어시스턴트", href: "#", icon: Sparkles, isAction: true },
];

// 3. 부원 사이드바 (9개 항목)
const MEMBER_NAV: NavItemDef[] = [
  { label: "홈", href: "/dashboard", icon: Home },
  { label: "내 업무", href: "/tasks", icon: ListChecks },
  { label: "내 프로젝트", href: "/projects", icon: Folder },
  { label: "캘린더", href: "/calendar", icon: CalendarDays },
  { label: "문서 및 회의록", href: "/meetings", icon: FileText },
  { label: "소통·피드", href: "/community", icon: Megaphone },
  { label: "내 지출·영수증", href: "/finance", icon: Receipt },
  { label: "내 전자결재", href: "/approvals", icon: FileCheck2 },
  { label: "AI 어시스턴트", href: "#", icon: Sparkles, isAction: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeRole, departmentName, orgName } = useRoleContext();

  const currentTab = searchParams?.get("tab");

  let navItems: NavItemDef[] = EXECUTIVE_NAV;
  let roleBadge = "회장단 관제";

  if (activeRole === "HEAD") {
    navItems = HEAD_NAV;
    roleBadge = departmentName ? `${departmentName} 실무` : "국장단 실무";
  } else if (activeRole === "MEMBER") {
    navItems = MEMBER_NAV;
    roleBadge = departmentName ? `${departmentName} 부원` : "부원 포커스";
  }

  const isItemActive = (item: NavItemDef) => {
    if (item.isAction) return false;
    const [path, query] = item.href.split("?");
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (query?.includes("tab=org-chart")) {
      return pathname === "/members" && currentTab === "org-chart";
    }
    if (path === "/members") {
      return pathname === "/members" && currentTab !== "org-chart";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-full flex-col gap-5 bg-sidebar px-4 pt-5 pb-5">
      {/* Workspace Brand Header */}
      <Link href="/dashboard" className="flex items-center gap-3" aria-label="Nexus 대시보드">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-xs">
          N
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="block font-bold text-sm text-foreground truncate">{orgName}</span>
          </div>
          <span className="inline-block rounded-md bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
            {roleBadge}
          </span>
        </div>
      </Link>

      {/* Global Quick Search Button */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
        aria-label="빠른 검색 (단축키: Cmd+K)"
      >
        <Search size={15} aria-hidden="true" />
        <span>빠른 검색</span>
        <span className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </span>
      </button>

      {/* Dynamic Nav Menu */}
      <nav aria-label="역할별 주 메뉴" className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-assistant"))}
                className="flex h-9.5 md:h-8.5 items-center gap-2.5 rounded-lg px-3 md:px-2.5 text-left text-xs font-medium text-foreground hover:bg-muted/60 transition-colors cursor-pointer mt-1"
                aria-label="Nexus AI 어시스턴트 열기"
              >
                <Icon size={16} className="text-primary shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                  AI
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex h-9.5 md:h-8.5 items-center gap-2.5 rounded-lg px-3 md:px-2.5 text-xs font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-accent-foreground" : "text-muted-foreground"}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher & Workspace Footer */}
      <div className="mt-auto space-y-3 pt-4 border-t border-border/60">
        <RoleViewSwitcher />

        <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Nexus 학생회 OS 가동 중</span>
        </div>
      </div>
    </div>
  );
}

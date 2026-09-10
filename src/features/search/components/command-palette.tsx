"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  LayoutGrid,
  Folder,
  ListChecks,
  CalendarDays,
  FileText,
  Receipt,
  Users,
  Ticket,
  FileCheck2,
  Megaphone,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { searchWorkspace, type SearchResultItem } from "@/features/search/actions";

interface NavigationItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  isAssistantAction?: boolean;
}

const DEFAULT_PAGES: NavigationItem[] = [
  { id: "p-dash", title: "대시보드", subtitle: "학생회 종합 운영 관제", url: "/dashboard", icon: LayoutGrid },
  { id: "p-proj", title: "프로젝트", subtitle: "프로젝트 진행 및 마일스톤", url: "/projects", icon: Folder },
  { id: "p-task", title: "업무 관리", subtitle: "전체 할 일 및 업무 배정", url: "/tasks", icon: ListChecks },
  { id: "p-cal", title: "학생회 캘린더", subtitle: "일정 및 행사 캘린더", url: "/calendar", icon: CalendarDays },
  { id: "p-meet", title: "회의록 및 결정사항", subtitle: "회의 안건 및 의결 기록", url: "/meetings", icon: FileText },
  { id: "p-fin", title: "회계 장부", subtitle: "예산 집행 및 영수증 증빙", url: "/finance", icon: Receipt },
  { id: "p-appr", title: "전자결재함", subtitle: "기안 및 결재 승인선", url: "/approvals", icon: FileCheck2 },
  { id: "p-form", title: "행사·티켓 관리", subtitle: "부스/행사 신청 및 QR 티켓", url: "/forms", icon: Ticket },
  { id: "p-comm", title: "소통·피드", subtitle: "공지사항, 건의, 학생 투표", url: "/community", icon: Megaphone },
  { id: "p-memb", title: "구성원 및 조직도", subtitle: "부서 배정 및 회원 관리", url: "/members", icon: Users },
  { id: "p-ai", title: "Nexus AI 어시스턴트", subtitle: "실시간 데이터 기반 질의응답", url: "#", icon: Sparkles, isAssistantAction: true },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
  };

  // Keyboard shortcut Cmd+K or Ctrl+K & Custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, []);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle live search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await searchWorkspace(trimmed);
        setResults(data);
        setSelectedIndex(0);
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const displayedItems = query.trim() ? results : DEFAULT_PAGES;

  const handleSelect = (index: number) => {
    const item = displayedItems[index];
    if (!item) return;

    handleClose();

    if ("isAssistantAction" in item && item.isAssistantAction) {
      window.dispatchEvent(new CustomEvent("open-assistant"));
      return;
    }

    router.push(item.url);
  };

  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, displayedItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + displayedItems.length) % Math.max(1, displayedItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="전역 통합 검색"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-16 sm:pt-24 p-3 backdrop-blur-xs animate-in fade-in-0"
      onClick={handleClose}
    >
      <div
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownModal}
      >
        {/* Search Bar */}
        <div className="flex items-center border-b border-border px-4 py-3 gap-2.5">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val.trim()) {
                setResults([]);
                setSelectedIndex(0);
              }
            }}
            placeholder="어디로 갈까요? 프로젝트, 업무, 회의, 결재, 공지 검색..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {query && !isPending && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setSelectedIndex(0);
              }}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-4" />
            </button>
          )}
          <span className="hidden sm:inline-block rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ESC
          </span>
        </div>

        {/* Results / Navigation List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {!query.trim() && (
            <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              빠른 바로가기 및 기능
            </p>
          )}

          {query.trim() && displayedItems.length === 0 && !isPending && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              &quot;{query}&quot;에 대한 검색 결과가 없습니다.
            </div>
          )}

          {displayedItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isSearchResult = "categoryLabel" in item;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(idx)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {"icon" in item && item.icon ? (
                    <item.icon className={`size-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                  ) : (
                    <Search className={`size-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm leading-tight">{item.title}</p>
                    {item.subtitle && (
                      <p
                        className={`truncate text-xs ${
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {isSearchResult && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {(item as SearchResultItem).categoryLabel}
                    </span>
                  )}
                  <ArrowRight
                    className={`size-3.5 ${
                      isSelected ? "text-primary-foreground" : "text-muted-foreground opacity-50"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ 탐색</span>
            <span>Enter 이동</span>
            <span>ESC 닫기</span>
          </div>
          <span className="font-mono text-[10px]">⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}

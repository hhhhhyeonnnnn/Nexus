"use client";

import { useState, type ReactNode } from "react";
import { Menu, X, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/features/search/components/command-palette";
import { AssistantModal } from "@/features/assistant/components/assistant-modal";
import { AssistantTrigger } from "@/features/assistant/components/assistant-trigger";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only fixed top-2 left-2 z-50 rounded-md bg-background p-3 focus:not-sr-only"
      >
        본문으로 건너뛰기
      </a>

      <aside
        className="fixed inset-y-0 left-0 hidden w-(--sidebar-width) overflow-y-auto border-r bg-sidebar md:block"
        aria-label="워크스페이스 탐색"
      >
        <Sidebar />
      </aside>

      <div className="md:pl-(--sidebar-width)">
        <header className="flex h-(--header-height) items-center justify-between gap-3 border-b px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
              aria-label="빠른 검색"
            >
              <Search className="size-3.5" />
              <span>통합 검색...</span>
              <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <AssistantTrigger
              variant="outline"
              size="sm"
              label="Nexus AI"
              className="h-8 gap-1.5 text-xs font-medium border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
            />
            <NotificationBell />
            <div className="hidden h-4 w-px bg-border sm:block" />
            <span className="hidden text-xs text-muted-foreground sm:inline-block">
              Nexus · 학생회 OS
            </span>
          </div>
        </header>

        {menuOpen && (
          <aside
            id="mobile-navigation"
            className="border-b md:hidden"
            aria-label="모바일 워크스페이스 탐색"
          >
            <Sidebar />
          </aside>
        )}

        <main id="main-content" tabIndex={-1} className="p-4 outline-none md:p-8">
          {children}
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Global AI Assistant Modal */}
      <AssistantModal />
    </div>
  );
}

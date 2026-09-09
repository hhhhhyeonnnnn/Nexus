"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-dvh">
      <a href="#main-content" className="sr-only fixed top-2 left-2 z-50 rounded-md bg-background p-3 focus:not-sr-only">본문으로 건너뛰기</a>
      <aside className="fixed inset-y-0 left-0 hidden w-(--sidebar-width) overflow-y-auto border-r bg-sidebar md:block" aria-label="워크스페이스 탐색"><Sidebar /></aside>
      <div className="md:pl-(--sidebar-width)">
        <header className="flex h-(--header-height) items-center gap-4 border-b px-4 md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
          <span className="text-xs text-muted-foreground">대시보드</span>
          <span className="ml-auto text-xs text-muted-foreground">Nexus · 학생회 OS</span>
        </header>
        {menuOpen && <aside id="mobile-navigation" className="border-b md:hidden" aria-label="모바일 워크스페이스 탐색"><Sidebar /></aside>}
        <main id="main-content" tabIndex={-1} className="p-4 outline-none md:p-8">{children}</main>
      </div>
    </div>
  );
}

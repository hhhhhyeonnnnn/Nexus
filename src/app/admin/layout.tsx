import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "사이트 관리자",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-foreground tracking-tight">Nexus</span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              사이트 운영자
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="default" className="text-xs">
              <a href="/onboarding">온보딩 홈</a>
            </Button>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="default" className="text-xs text-muted-foreground">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

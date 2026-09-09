import type { Metadata } from "next";
import { logout } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "학생회 온보딩",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-foreground tracking-tight">Nexus</span>
            <span className="text-xs text-muted-foreground">· 학생회 온보딩</span>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="default" className="text-xs text-muted-foreground">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-xl">{children}</div>
      </main>
    </div>
  );
}

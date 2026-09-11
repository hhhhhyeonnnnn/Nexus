"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 발생 시 콘솔 및 모니터링 로깅
    console.error("[Nexus App Error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md border-border/80 bg-card p-6 shadow-lg text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground">
          페이지를 불러오는 중 문제가 발생했습니다
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          네트워크 연결이 불안정하거나 일시적인 처리 오류일 수 있습니다. 다시 시도하시거나 대시보드로 이동해 주세요.
        </p>

        {error.digest && (
          <div className="mt-3 inline-block rounded bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground">
            오류 코드: {error.digest}
          </div>
        )}

        {process.env.NODE_ENV === "development" && error.message && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              오류 상세 정보 (개발 모드 전용)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/60 p-2.5 text-[11px] font-mono text-destructive">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => reset()}
            className="flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            다시 시도
          </Button>

          <Button
            type="button"
            variant="outline"
            asChild
          >
            <Link href="/dashboard" className="flex items-center justify-center gap-1.5">
              <Home className="size-3.5" />
              대시보드
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground"
          >
            <RefreshCw className="size-3" />
            새로고침
          </Button>
        </div>
      </Card>
    </main>
  );
}

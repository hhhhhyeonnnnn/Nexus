import Link from "next/link";
import { Compass, FileQuestion, Home, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-[75vh] flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md border-border/80 bg-card p-6 shadow-lg text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="size-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Compass className="size-3" />
          404 Not Found
        </div>

        <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground">
          요청하신 페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          입력하신 주소가 잘못되었거나, 삭제 또는 이동된 페이지일 수 있습니다. 아래 바로가기를 통해 안전하게 이동해 주세요.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="flex items-center justify-center gap-1.5">
            <Link href="/dashboard">
              <Home className="size-3.5" />
              대시보드로 이동
            </Link>
          </Button>

          <Button variant="outline" asChild className="flex items-center justify-center gap-1.5">
            <Link href="/feed">
              <Newspaper className="size-3.5" />
              캠퍼스 소통 피드
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}

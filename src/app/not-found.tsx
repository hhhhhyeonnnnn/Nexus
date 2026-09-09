import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-muted-foreground">주소를 확인하거나 대시보드로 이동해 주세요.</p>
      <Link className="text-primary underline underline-offset-4" href="/dashboard">대시보드로 돌아가기</Link>
    </main>
  );
}

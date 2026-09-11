import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8">
      <div className="relative flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary/20" />
        <Loader2 className="absolute size-10 animate-spin text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        페이지 데이터를 불러오는 중입니다...
      </p>
    </div>
  );
}

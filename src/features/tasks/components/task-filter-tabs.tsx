"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRoleContext } from "@/features/auth/role-context";
import { useRealtimeRefresh } from "@/lib/supabase/realtime";

const TABS = [
  { key: "ALL", label: "전체" },
  { key: "TODO", label: "대기 (할 일)" },
  { key: "IN_PROGRESS", label: "진행 중" },
  { key: "DONE", label: "완료됨" },
] as const;

export function TaskFilterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "ALL";
  const { organizationId } = useRoleContext();

  useRealtimeRefresh({
    table: "tasks",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    enabled: Boolean(organizationId),
  });

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "ALL") {
      params.delete("status");
    } else {
      params.set("status", key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between border-b border-border pb-1">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelect(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium shrink-0 ml-2">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
        실시간 업무 동기화
      </span>
    </div>
  );
}

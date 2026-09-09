"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "ALL", label: "전체" },
  { key: "IN_PROGRESS", label: "진행 중" },
  { key: "PLANNED", label: "계획됨" },
  { key: "COMPLETED", label: "완료됨" },
  { key: "ARCHIVED", label: "보관됨" },
] as const;

export function ProjectFilterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "ALL";

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
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-1">
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
  );
}

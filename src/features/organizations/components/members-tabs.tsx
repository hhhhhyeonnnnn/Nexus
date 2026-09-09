"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembersTabsProps {
  memberCount: number;
  pendingCount: number;
  isAdmin: boolean;
}

export function MembersTabs({ memberCount, pendingCount, isAdmin }: MembersTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "members";

  const handleSelect = (tab: "members" | "requests") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "members") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <button
        type="button"
        onClick={() => handleSelect("members")}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
          currentTab === "members"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Users size={16} aria-hidden="true" />
        <span>구성원 목록</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            currentTab === "members"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {memberCount}
        </span>
      </button>

      {isAdmin && (
        <button
          type="button"
          onClick={() => handleSelect("requests")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            currentTab === "requests"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <UserPlus size={16} aria-hidden="true" />
          <span>가입 신청</span>
          {pendingCount > 0 ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-bold",
                currentTab === "requests"
                  ? "bg-rose-500 text-white"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
              )}
            >
              {pendingCount}
            </span>
          ) : (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                currentTab === "requests"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              0
            </span>
          )}
        </button>
      )}
    </div>
  );
}

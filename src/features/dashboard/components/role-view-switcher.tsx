"use client";

import { useRoleContext } from "@/features/auth/role-context";
import type { UserRoleType } from "@/features/projects/actions";
import { Eye, Shield, Briefcase, User, RotateCcw } from "lucide-react";

export function RoleViewSwitcher() {
  const { actualRole, activeRole, setActiveRole, isPrivileged, departmentName, jobTitle } =
    useRoleContext();

  if (!isPrivileged) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
        <User className="size-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">
            {departmentName ? `${departmentName} ` : ""}부원
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{jobTitle || "일반 구성원"}</p>
        </div>
      </div>
    );
  }

  const isPreviewing = actualRole !== activeRole;

  const roles: Array<{ key: UserRoleType; label: string; icon: typeof Shield }> = [
    { key: "EXECUTIVE", label: "회장단", icon: Shield },
    { key: "HEAD", label: "국장단", icon: Briefcase },
    { key: "MEMBER", label: "부원", icon: User },
  ];

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Eye className="size-3.5 text-primary" />
          <span>역할별 뷰포트</span>
          {isPreviewing && (
            <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              미리보기 중
            </span>
          )}
        </div>

        {isPreviewing && (
          <button
            type="button"
            onClick={() => setActiveRole(actualRole)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="본래 직급으로 복귀"
          >
            <RotateCcw className="size-3" />
            <span>원래대로</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/60 p-0.5">
        {roles.map(({ key, label, icon: Icon }) => {
          const isActive = activeRole === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveRole(key)}
              className={`flex items-center justify-center gap-1 rounded-md py-1 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

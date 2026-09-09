import type { OrgRole } from "@/features/organizations/actions";
import { cn } from "@/lib/utils";

const ROLE_MAP: Record<OrgRole, { label: string; className: string }> = {
  PRESIDENT: {
    label: "총학생회장",
    className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  },
  VICE_PRESIDENT: {
    label: "부총학생회장",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  ADMIN: {
    label: "관리자",
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  MEMBER: {
    label: "구성원",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function MemberRoleBadge({ role }: { role: OrgRole }) {
  const config = ROLE_MAP[role] ?? {
    label: role,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

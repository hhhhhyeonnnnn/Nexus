import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "outline" | "success" | "warning" | "destructive";
}) {
  return (
    <span
      className={cn("inline-flex h-6 shrink-0 items-center rounded-sm px-2 text-xs font-normal", {
        "bg-muted text-muted-foreground": tone === "neutral",
        "bg-accent text-accent-foreground": tone === "accent",
        "border bg-background text-muted-foreground": tone === "outline",
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium": tone === "success",
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium": tone === "warning",
        "bg-destructive/15 text-destructive font-medium": tone === "destructive",
      })}
    >
      {children}
    </span>
  );
}

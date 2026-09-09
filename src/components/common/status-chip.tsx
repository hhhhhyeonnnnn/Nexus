import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "outline" }) {
  return <span className={cn("inline-flex h-6 shrink-0 items-center rounded-sm px-2 text-xs font-normal", {
    "bg-muted text-muted-foreground": tone === "neutral",
    "bg-accent text-accent-foreground": tone === "accent",
    "border bg-background text-muted-foreground": tone === "outline",
  })}>{children}</span>;
}

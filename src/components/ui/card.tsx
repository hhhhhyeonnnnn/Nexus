import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section data-slot="card" className={cn("rounded-lg border bg-card p-5 text-card-foreground", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-base font-bold", className)} {...props} />;
}

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

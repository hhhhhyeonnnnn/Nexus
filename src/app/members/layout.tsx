import { AppShell } from "@/components/layout/app-shell";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

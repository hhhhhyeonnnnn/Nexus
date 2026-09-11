import { getCurrentUserOrganization, getProjects } from "@/features/projects/actions";
import { getDepartmentsWithMembers } from "@/features/departments/actions";
import { getApprovals } from "@/features/approvals/actions";
import { ApprovalsView } from "@/features/approvals/components/approvals-view";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [approvals, projects, deptData] = await Promise.all([
    getApprovals(),
    getProjects("ALL"),
    getDepartmentsWithMembers(),
  ]);

  const departments = deptData.departments.map((d) => ({ id: d.id, name: d.name }));
  const availableProjects = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <ApprovalsView
      approvals={approvals}
      currentUserId={user?.id || ""}
      departments={departments}
      projects={availableProjects}
    />
  );
}

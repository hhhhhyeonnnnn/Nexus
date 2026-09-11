import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getDashboardProjectSummaries,
  getCurrentUserOrganization,
  getDashboardBudgetSummary,
  getDashboardActivityFeed,
  getDashboardControlTowerMetrics,
  getMemberHomeData,
  getDepartmentDashboardData,
} from "@/features/projects/actions";
import { getDashboardTaskSummaries } from "@/features/tasks/actions";
import { getDashboardMeetingSummaries } from "@/features/meetings/actions";
import { DashboardRoleContainer } from "@/features/dashboard/components/dashboard-role-container";

export const metadata: Metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    projectSummaries,
    taskSummaries,
    membership,
    budgetSummary,
    meetingSummaries,
    activityFeed,
    controlTowerMetrics,
    memberHomeData,
    departmentHeadData,
  ] = await Promise.all([
    getDashboardProjectSummaries(),
    getDashboardTaskSummaries(),
    getCurrentUserOrganization(),
    getDashboardBudgetSummary(),
    getDashboardMeetingSummaries(),
    getDashboardActivityFeed(),
    getDashboardControlTowerMetrics(),
    getMemberHomeData(),
    getDepartmentDashboardData(),
  ]);

  if (!membership) {
    redirect("/onboarding");
  }

  const executiveProps = {
    projectSummaries,
    taskSummaries,
    budgetSummary,
    meetingSummaries,
    activityFeed,
    controlTowerMetrics,
    membership,
  };

  return (
    <DashboardRoleContainer
      executiveProps={executiveProps}
      memberHomeData={memberHomeData}
      departmentHeadData={departmentHeadData}
    />
  );
}

"use client";

import { useRoleContext } from "@/features/auth/role-context";
import { useRealtimeRefresh } from "@/lib/supabase/realtime";
import { MemberHomeView } from "@/features/dashboard/components/member-home-view";
import { DepartmentHeadView } from "@/features/dashboard/components/department-head-view";
import {
  ExecutiveControlTowerView,
  type ExecutiveControlTowerProps,
} from "@/features/dashboard/components/executive-control-tower-view";
import type {
  MemberHomeData,
  DepartmentHeadData,
} from "@/features/projects/actions";

interface DashboardRoleContainerProps {
  executiveProps: ExecutiveControlTowerProps;
  memberHomeData: MemberHomeData;
  departmentHeadData: DepartmentHeadData;
}

export function DashboardRoleContainer({
  executiveProps,
  memberHomeData,
  departmentHeadData,
}: DashboardRoleContainerProps) {
  const { activeRole, organizationId } = useRoleContext();

  // Realtime background sync for dashboard control tower and workload
  useRealtimeRefresh({
    table: "tasks",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    enabled: Boolean(organizationId),
  });

  useRealtimeRefresh({
    table: "approvals",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    enabled: Boolean(organizationId),
  });

  useRealtimeRefresh({
    table: "form_submissions",
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
    enabled: Boolean(organizationId),
  });

  if (activeRole === "MEMBER") {
    return <MemberHomeView data={memberHomeData} />;
  }

  if (activeRole === "HEAD") {
    return <DepartmentHeadView data={departmentHeadData} />;
  }

  return <ExecutiveControlTowerView {...executiveProps} />;
}

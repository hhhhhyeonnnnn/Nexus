"use client";

import { useRoleContext } from "@/features/auth/role-context";
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
  const { activeRole } = useRoleContext();

  if (activeRole === "MEMBER") {
    return <MemberHomeView data={memberHomeData} />;
  }

  if (activeRole === "HEAD") {
    return <DepartmentHeadView data={departmentHeadData} />;
  }

  return <ExecutiveControlTowerView {...executiveProps} />;
}

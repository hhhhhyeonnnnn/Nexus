import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, UserPlus, Info } from "lucide-react";
import {
  getOrganizationMembersDetailed,
  getPendingJoinRequestsForCurrentOrg,
} from "@/features/organizations/actions";
import { getDepartmentsWithMembers } from "@/features/departments/actions";
import { MembersTabs } from "@/features/organizations/components/members-tabs";
import { MemberItem } from "@/features/organizations/components/member-item";
import { JoinRequestItem } from "@/features/organizations/components/join-request-item";
import { MemberRoleBadge } from "@/features/organizations/components/member-role-badge";
import { OrgChartView } from "@/features/departments/components/org-chart-view";

export const metadata: Metadata = {
  title: "구성원 관리",
};

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const rawTab = params.tab;
  const currentTab =
    rawTab === "requests"
      ? "requests"
      : rawTab === "org-chart"
        ? "org-chart"
        : "members";

  const [data, orgChartData] = await Promise.all([
    getOrganizationMembersDetailed(),
    getDepartmentsWithMembers(),
  ]);

  if (!data.organization) {
    redirect("/onboarding");
  }

  const joinRequests =
    currentTab === "requests" && data.isAdmin
      ? await getPendingJoinRequestsForCurrentOrg()
      : [];

  const isPresident = data.myRole === "PRESIDENT";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">구성원 관리</h1>
            {data.myRole && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border">
                <span>내 권한:</span>
                <MemberRoleBadge role={data.myRole} />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {data.organization.universityName} {data.organization.name} 소속 구성원을 확인하고 가입 신청을 관리합니다.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <MembersTabs
        memberCount={data.members.length}
        pendingCount={data.pendingRequestsCount}
        departmentCount={orgChartData.departments.length}
        isAdmin={data.isAdmin}
      />

      {/* Tab Content */}
      {currentTab === "members" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>등록된 구성원 ({data.members.length}명)</span>
            {data.isAdmin && (
              <span className="text-[11px] text-muted-foreground">
                관리자는 구성원의 역할을 변경하거나 부서/직책을 설정할 수 있습니다.
              </span>
            )}
          </div>

          {data.members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Users size={36} className="mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-foreground text-sm">구성원이 없습니다</h3>
              <p className="mt-1 text-xs text-muted-foreground">아직 등록된 구성원이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.members.map((member) => (
                <MemberItem
                  key={member.userId}
                  member={member}
                  currentUserId={data.currentUserId}
                  isAdmin={data.isAdmin}
                  isPresident={isPresident}
                  departments={orgChartData.departments.map((d) => ({
                    id: d.id,
                    name: d.name,
                    color: d.color,
                  }))}
                />
              ))}
            </div>
          )}
        </div>
      ) : currentTab === "org-chart" ? (
        <OrgChartView data={orgChartData} currentUserId={data.currentUserId} />
      ) : (
        <div className="space-y-4">
          {!data.isAdmin ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Info size={36} className="mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-foreground text-sm">접근 권한이 없습니다</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                학생회 가입 신청 승인 및 거부는 학생회 관리자(회장, 부회장, 관리자)만 가능합니다.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>승인 대기 중인 신청 ({joinRequests.length}건)</span>
                <span className="text-[11px]">
                  승인 시 학생회의 정식 구성원(MEMBER)으로 즉시 등록됩니다.
                </span>
              </div>

              {joinRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <UserPlus size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-semibold text-foreground text-sm">대기 중인 가입 신청이 없습니다</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    새로운 팀원이 가입을 신청하면 이곳에서 확인하고 바로 승인할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((req) => (
                    <JoinRequestItem key={req.id} request={req} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

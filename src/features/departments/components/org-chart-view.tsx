"use client";

import { useTransition, useState } from "react";
import { Crown, Sparkles, Building2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberRoleBadge } from "@/features/organizations/components/member-role-badge";
import { CreateDepartmentDialog } from "./create-department-dialog";
import { EditDepartmentDialog } from "./edit-department-dialog";
import { AssignMemberDialog } from "./assign-member-dialog";
import {
  batchSetupDefaultDepartments,
  type OrgChartPageData,
  type DepartmentWithMembers,
} from "@/features/departments/actions";
import { getDepartmentColorClasses } from "@/features/departments/utils";

interface OrgChartViewProps {
  data: OrgChartPageData;
  currentUserId: string;
}

export function OrgChartView({ data, currentUserId }: OrgChartViewProps) {
  const [isBatchPending, startBatchTransition] = useTransition();
  const [batchError, setBatchError] = useState<string | null>(null);

  const handleBatchDefaults = () => {
    if (
      !confirm(
        "기본 4개 부서(기획국, 사무재정국, 홍보디자인국, 복지대외협력국)를 생성하시겠습니까?",
      )
    ) {
      return;
    }
    setBatchError(null);
    startBatchTransition(async () => {
      const res = await batchSetupDefaultDepartments();
      if (res.error) {
        setBatchError(res.error);
      }
    });
  };

  const departmentOptions = data.departments.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
  }));

  return (
    <div className="space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">학생회 조직도</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {data.departments.length}개 국/부서
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            회장단 및 집행국별 직책 체계와 소속 구성원을 한눈에 파악합니다.
          </p>
        </div>

        {data.isAdmin && (
          <div className="flex items-center gap-2">
            {data.departments.length === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBatchDefaults}
                disabled={isBatchPending}
                className="gap-1.5 text-xs text-primary hover:text-primary"
              >
                <Sparkles className="size-3.5" />
                <span>{isBatchPending ? "생성 중..." : "기본 4대 국 자동 생성"}</span>
              </Button>
            )}
            <CreateDepartmentDialog buttonLabel="새 부서 추가" />
          </div>
        )}
      </div>

      {batchError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {batchError}
        </div>
      )}

      {/* Tier 1: Executive Leadership (회장단) */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Crown className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">회장단</h4>
                <p className="text-[11px] text-muted-foreground">총괄 의사결정 및 대의기구 대표</p>
              </div>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {data.executiveMembers.length}명
            </span>
          </div>

          {data.executiveMembers.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              등록된 회장단 구성원이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.executiveMembers.map((exec) => {
                const isPresident = exec.role === "PRESIDENT";
                return (
                  <div
                    key={exec.userId}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {exec.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {exec.name}
                          </span>
                          {exec.userId === currentUserId && (
                            <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
                              나
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{exec.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          isPresident
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                        }`}
                      >
                        {isPresident ? "총학생회장" : "부총학생회장"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tree Line Connector */}
        <div className="h-8 w-0.5 bg-border my-1" />
      </div>

      {/* Tier 2: Executive Departments (집행국 카드 그리드) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">집행 부서 (국/팀)</h4>
            <span className="text-xs text-muted-foreground">
              총 {data.departments.reduce((acc, d) => acc + d.members.length, 0)}명 배정
            </span>
          </div>
          {data.isAdmin && data.departments.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              우측 상단 메뉴(···)로 부서 정보 및 정렬 순서를 관리할 수 있습니다.
            </span>
          )}
        </div>

        {data.departments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <h4 className="text-sm font-semibold text-foreground">등록된 부서가 없습니다</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              학생회의 집행국(기획국, 재정국, 홍보국 등)을 등록하고 국원들을 배치해 체계적으로 조직을 운영해보세요.
            </p>
            {data.isAdmin && (
              <div className="mt-5 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDefaults}
                  disabled={isBatchPending}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="size-3.5 text-primary" />
                  <span>기본 4대 국 1초 세팅</span>
                </Button>
                <CreateDepartmentDialog buttonLabel="직접 부서 만들기" />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.departments.map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                allDepartments={departmentOptions}
                isAdmin={data.isAdmin}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tier 3: Unassigned Members (미배정 구성원) */}
      {data.unassignedMembers.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-bold text-foreground">미배정 구성원</h4>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {data.unassignedMembers.length}명
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              아직 특정 부서에 배정되지 않은 학생회 구성원입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.unassignedMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">
                    {member.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {member.name}
                      </span>
                      {member.userId === currentUserId && (
                        <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                          나
                        </span>
                      )}
                      <MemberRoleBadge role={member.role} />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>

                {data.isAdmin && (
                  <div className="shrink-0">
                    <AssignMemberDialog
                      member={member}
                      departments={departmentOptions}
                      triggerLabel="부서 배정"
                      triggerVariant="outline"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Department Card Component
// ---------------------------------------------------------------------------

function DepartmentCard({
  department,
  allDepartments,
  isAdmin,
  currentUserId,
}: {
  department: DepartmentWithMembers;
  allDepartments: Array<{ id: string; name: string; color: string }>;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const colorStyles = getDepartmentColorClasses(department.color);

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md border-t-4 ${colorStyles.borderTop}`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between p-4 pb-3 border-b border-border/60">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${colorStyles.dot}`} />
              <h5 className="font-bold text-base text-foreground truncate">{department.name}</h5>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground shrink-0">
                {department.members.length}명
              </span>
            </div>
            {department.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{department.description}</p>
            )}
          </div>

          {isAdmin && (
            <div className="shrink-0">
              <EditDepartmentDialog department={department} />
            </div>
          )}
        </div>

        {/* Card Body: Members list */}
        <div className="p-4 space-y-3">
          {department.members.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground/60 border border-dashed border-border/80 rounded-xl">
              소속된 국원이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {department.members.map((member) => {
                const isLeader = department.leader?.userId === member.userId;
                return (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                      isLeader
                        ? "bg-muted/40 border border-border/80"
                        : "hover:bg-muted/30 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                          isLeader
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {member.name}
                          </span>
                          {member.userId === currentUserId && (
                            <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                              나
                            </span>
                          )}
                          {/* Title Badge */}
                          {member.jobTitle ? (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                isLeader
                                  ? "bg-primary text-primary-foreground font-semibold"
                                  : "bg-muted text-foreground/80 border border-border"
                              }`}
                            >
                              {member.jobTitle}
                            </span>
                          ) : isLeader ? (
                            <span className="rounded bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                              책임자
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="shrink-0 ml-2">
                        <AssignMemberDialog
                          member={{
                            userId: member.userId,
                            name: member.name,
                            departmentId: department.id,
                            jobTitle: member.jobTitle,
                          }}
                          departments={allDepartments}
                          triggerLabel="변경"
                          triggerVariant="ghost"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Quick assign button for admins */}
      {isAdmin && (
        <div className="p-3 pt-0">
          {/* We can provide a trigger to assign member if needed */}
        </div>
      )}
    </div>
  );
}

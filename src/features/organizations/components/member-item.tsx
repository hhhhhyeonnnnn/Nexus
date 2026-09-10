"use client";

import { useTransition, useState } from "react";
import { Shield, UserMinus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberRoleBadge } from "./member-role-badge";
import { EditProfileDialog } from "@/features/auth/components/edit-profile-dialog";
import { AssignMemberDialog } from "@/features/departments/components/assign-member-dialog";
import { getDepartmentColorClasses } from "@/features/departments/utils";
import {
  updateMemberRole,
  removeMember,
  type OrganizationMemberDetailed,
  type OrgRole,
} from "@/features/organizations/actions";

interface MemberItemProps {
  member: OrganizationMemberDetailed;
  currentUserId: string;
  isAdmin: boolean;
  isPresident: boolean;
  departments?: Array<{ id: string; name: string; color: string }>;
}

export function MemberItem({
  member,
  currentUserId,
  isAdmin,
  departments = [],
}: MemberItemProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isMe = member.userId === currentUserId;

  const handleRoleChange = (newRole: OrgRole) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateMemberRole(member.userId, newRole);
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const handleRemove = () => {
    if (!confirm(`${member.name}님을 학생회에서 내보내시겠습니까?`)) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await removeMember(member.userId);
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const joinedDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {member.name.slice(0, 1) || "U"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">{member.name}</span>
            {isMe && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                나
              </span>
            )}
            <MemberRoleBadge role={member.role} />

            {member.departmentName && (
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                  getDepartmentColorClasses(member.departmentColor).badge
                }`}
              >
                {member.departmentName}
              </span>
            )}

            {member.jobTitle && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80 border border-border">
                {member.jobTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="truncate">{member.email}</span>
            {joinedDate && (
              <>
                <span>•</span>
                <span>가입일 {joinedDate}</span>
              </>
            )}
          </div>
          {errorMsg && <p className="text-xs text-destructive mt-1">{errorMsg}</p>}
        </div>
      </div>

      {isAdmin && !isMe && member.role !== "PRESIDENT" && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
          {departments.length > 0 && (
            <AssignMemberDialog
              member={{
                userId: member.userId,
                name: member.name,
                departmentId: member.departmentId,
                jobTitle: member.jobTitle,
              }}
              departments={departments}
              triggerLabel="부서/직책"
              triggerVariant="outline"
            />
          )}

          {member.role === "MEMBER" ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleRoleChange("ADMIN")}
              className="text-xs h-8 gap-1.5"
              title="관리자로 권한을 부여합니다"
            >
              <Shield size={14} className="text-amber-600" />
              <span>관리자 지정</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleRoleChange("MEMBER")}
              className="text-xs h-8 gap-1.5"
              title="일반 구성원으로 역할을 변경합니다"
            >
              <UserCheck size={14} className="text-muted-foreground" />
              <span>구성원 강등</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleRemove}
            className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
            title="학생회에서 내보내기"
          >
            <UserMinus size={14} />
            <span>내보내기</span>
          </Button>
        </div>
      )}

      {isMe && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <EditProfileDialog currentName={member.name} />
        </div>
      )}
    </div>
  );
}

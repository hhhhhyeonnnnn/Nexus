import type { Metadata } from "next";
import { searchOrganizations } from "@/features/organizations/actions";
import { JoinOrgForm } from "@/features/organizations/components/join-org-form";

export const metadata: Metadata = {
  title: "학생회 가입 신청",
};

export const dynamic = "force-dynamic";

export default async function JoinOrgPage() {
  const organizations = await searchOrganizations();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">학생회 가입 신청</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          가입하고자 하는 학생회를 선택하고 신청서를 제출하세요. 해당 학생회 관리자가 승인합니다.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <JoinOrgForm organizations={organizations} />
      </div>
    </div>
  );
}

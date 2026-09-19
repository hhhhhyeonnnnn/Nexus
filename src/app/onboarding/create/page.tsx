import type { Metadata } from "next";
import { CreateOrgForm } from "@/features/organizations/components/create-org-form";

export const metadata: Metadata = {
  title: "새 학생회 만들기",
};

export default function CreateOrgPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">새 학생회 만들기</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          학생회 정보를 입력하면 즉시 생성되며, 생성한 계정에 회장 권한이 부여됩니다.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <CreateOrgForm />
      </div>
    </div>
  );
}

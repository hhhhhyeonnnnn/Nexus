import type { Metadata } from "next";
import { CreateOrgRequestForm } from "@/features/organizations/components/create-org-request-form";

export const metadata: Metadata = {
  title: "새 학생회 생성 신청",
};

export default function CreateOrgPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">새 학생회 생성 신청</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          학생회 조직 정보를 입력하시면 사이트 운영자가 확인 후 승인해 드립니다.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <CreateOrgRequestForm />
      </div>
    </div>
  );
}

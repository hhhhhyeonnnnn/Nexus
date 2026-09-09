import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPendingCreationRequests, isCurrentUserSiteAdmin } from "@/features/organizations/actions";
import { CreationRequestsTable } from "@/features/organizations/components/creation-requests-table";

export const metadata: Metadata = {
  title: "조직 생성 신청 심사",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isSiteAdmin = await isCurrentUserSiteAdmin();
  if (!isSiteAdmin) {
    redirect("/onboarding?error=admin_required");
  }

  const requests = await getPendingCreationRequests();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">조직 생성 신청 심사</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          사용자들이 신청한 학생회 조직을 검토하고 승인하거나 거부합니다. 승인 시 해당 신청자가 대표(PRESIDENT)로 등록됩니다.
        </p>
      </div>

      <CreationRequestsTable requests={requests} />
    </div>
  );
}

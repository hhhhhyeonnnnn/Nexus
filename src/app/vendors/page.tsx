import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getVendors } from "@/features/vendors/actions";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { VendorListView } from "@/features/vendors/components/vendor-list-view";

export const metadata: Metadata = {
  title: "제휴·협력 업체",
  description: "학생회 제휴 업체 목록, 연락처, 계약 및 거래 이력을 관리합니다.",
};

export const dynamic = "force-dynamic";

interface VendorsPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const data = await getVendors(params.category);

  return (
    <VendorListView
      initialVendors={data.vendors}
      categoryCounts={data.categoryCounts}
      isAdmin={data.isAdmin}
    />
  );
}

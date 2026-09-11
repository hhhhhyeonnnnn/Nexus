import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/features/finance/actions";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { FinanceView } from "@/features/finance/components/finance-view";

export const metadata: Metadata = {
  title: "회계 장부",
  description: "학생회비 및 프로젝트별 예산, 수입·지출 내역과 영수증 증빙을 관리합니다.",
};

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    redirect("/onboarding");
  }

  const data = await getFinanceData();

  return <FinanceView data={data} />;
}

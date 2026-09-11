import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getMyRequests, isCurrentUserSiteAdmin } from "@/features/organizations/actions";
import { OnboardingStatus } from "@/features/organizations/components/onboarding-status";

export const metadata: Metadata = {
  title: "학생회 시작하기",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { creationRequests, joinRequests, userId } = await getMyRequests();
  const isSiteAdmin = await isCurrentUserSiteAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">학생회에 참여하세요</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          새로운 학생회 조직을 등록하거나, 기존 학생회에 가입을 신청할 수 있습니다.
        </p>
      </div>

      {params.error === "admin_required" && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
          ⚠️ 사이트 운영자(is_site_admin) 권한이 있는 계정만 /admin 페이지에 접근할 수 있습니다.
          Supabase SQL Editor에서 현재 로그인한 계정의 profiles.is_site_admin 값을 true로 설정해 주세요.
        </div>
      )}

      {params.status === "creation_requested" && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
          조직 생성 신청이 성공적으로 접수되었습니다. 사이트 운영자의 승인 후 대시보드를 이용하실 수 있습니다.
        </div>
      )}

      {params.status === "join_requested" && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
          가입 신청이 성공적으로 전달되었습니다. 학생회 관리자의 승인 후 대시보드를 이용하실 수 있습니다.
        </div>
      )}

      {params.status === "left_org" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-800">
          학생회에서 정상적으로 탈퇴 처리되었습니다. 새로운 학생회를 생성하거나 다른 학생회에 가입을 신청해 보세요.
        </div>
      )}

      {/* Existing application status */}
      <OnboardingStatus
        creationRequests={creationRequests}
        joinRequests={joinRequests}
        userId={userId}
      />

      {/* Choice cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
          <div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
              +
            </div>
            <h3 className="mt-3 font-semibold text-foreground">새 학생회 생성</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              우리 학교에 아직 Nexus 학생회가 없다면 조직 생성을 신청하세요. 승인 시 총학생회장(대표) 권한이 부여됩니다.
            </p>
          </div>
          <Button asChild className="mt-5 w-full">
            <a href="/onboarding/create">생성 신청하기</a>
          </Button>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
          <div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary font-bold">
              →
            </div>
            <h3 className="mt-3 font-semibold text-foreground">기존 학생회 가입</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              이미 등록된 학생회에 가입을 신청하세요. 학생회 관리자가 확인 후 가입을 승인합니다.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-5 w-full">
            <a href="/onboarding/join">가입 신청하기</a>
          </Button>
        </div>
      </div>

      {isSiteAdmin && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-xs text-primary font-medium">
            🛡️ 사이트 운영자(Site Admin) 권한을 보유하고 계십니다.
          </p>
          <Button asChild size="default" variant="outline" className="mt-2 text-xs">
            <a href="/admin">조직 생성 심사 관리자 페이지 바로가기</a>
          </Button>
        </div>
      )}
    </div>
  );
}

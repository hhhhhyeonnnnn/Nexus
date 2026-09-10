import { getPublicFeed } from "@/features/community/actions";
import { PublicFeedClient } from "@/features/community/components/public-feed-client";
import Link from "next/link";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicFeedPage(props: {
  searchParams: Promise<{ org?: string }>;
}) {
  const searchParams = await props.searchParams;
  const orgId = searchParams.org;

  const { organization, announcements, petitions, polls } = await getPublicFeed(orgId);

  if (!organization) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center space-y-4 shadow-sm">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Megaphone className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-foreground">학생회 피드를 찾을 수 없습니다</h1>
            <p className="text-xs text-muted-foreground">
              등록된 활성 학생회 조직이 없습니다. 관리자에게 문의해 주세요.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-xs font-semibold text-primary hover:underline pt-2"
          >
            학생회 로그인 바로가기 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PublicFeedClient
      organization={organization}
      announcements={announcements}
      petitions={petitions}
      polls={polls}
    />
  );
}

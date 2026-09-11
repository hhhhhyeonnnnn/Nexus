import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeetings } from "@/features/meetings/actions";
import { getDecisions } from "@/features/decisions/actions";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { MeetingListView } from "@/features/meetings/components/meeting-list-view";

export const metadata: Metadata = {
  title: "문서 및 회의록",
  description: "학생회 회의록 작성 및 핵심 결정사항(Decisions)을 아카이빙합니다.",
};

export const dynamic = "force-dynamic";

interface MeetingsPageProps {
  searchParams: Promise<{
    tab?: "meetings" | "decisions";
    project?: string;
  }>;
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const [meetingsData, decisionsData] = await Promise.all([
    getMeetings(params.project),
    getDecisions(params.project),
  ]);

  return (
    <MeetingListView
      initialMeetings={meetingsData.meetings}
      initialDecisions={decisionsData.decisions}
      projects={meetingsData.projects}
      isAdmin={meetingsData.isAdmin}
      initialTab={params.tab || "meetings"}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetingById } from "@/features/meetings/actions";
import { MeetingDetailView } from "@/features/meetings/components/meeting-detail-view";

export const dynamic = "force-dynamic";

interface MeetingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: MeetingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { meeting } = await getMeetingById(id);
  if (!meeting) {
    return { title: "회의록을 찾을 수 없습니다" };
  }
  return {
    title: meeting.title,
    description: `${meeting.title} - 학생회 회의록 및 결정사항`,
  };
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const { meeting, decisions, projects, members, isAdmin } = await getMeetingById(id);

  if (!meeting) {
    notFound();
  }

  return (
    <MeetingDetailView
      meeting={meeting}
      decisions={decisions}
      projects={projects}
      members={members}
      isAdmin={isAdmin}
    />
  );
}

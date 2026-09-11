import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getAnnouncements, getPetitions, getPolls } from "@/features/community/actions";
import { CommunityView } from "@/features/community/components/community-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    redirect("/onboarding");
  }

  const [announcements, petitions, polls] = await Promise.all([
    getAnnouncements(),
    getPetitions(),
    getPolls(),
  ]);

  const isAdmin = membership.role === "PRESIDENT" || membership.role === "VICE_PRESIDENT";

  return (
    <CommunityView
      announcements={announcements}
      petitions={petitions}
      polls={polls}
      isAdmin={isAdmin}
    />
  );
}

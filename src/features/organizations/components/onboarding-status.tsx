import { Button } from "@/components/ui/button";

type CreationRequest = {
  id: string;
  org_name: string;
  university_name: string;
  status: string;
  created_at: string;
};

type JoinRequest = {
  id: string;
  status: string;
  created_at: string;
  organizations: {
    name: string;
    university_name: string;
  } | null;
};

export function OnboardingStatus({
  creationRequests,
  joinRequests,
}: {
  creationRequests: CreationRequest[];
  joinRequests: JoinRequest[];
}) {
  if (creationRequests.length === 0 && joinRequests.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">심사 중</span>;
      case "approved":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">승인됨</span>;
      case "rejected":
        return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">반려됨</span>;
      default:
        return <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">내 신청 현황</h2>

      <div className="flex flex-col gap-3">
        {creationRequests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3"
          >
            <div>
              <div className="text-xs text-muted-foreground">조직 생성 신청</div>
              <div className="text-sm font-medium text-foreground">
                {req.org_name} ({req.university_name})
              </div>
              <div className="text-xs text-muted-foreground">
                신청일: {new Date(req.created_at).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <div>{getStatusBadge(req.status)}</div>
          </div>
        ))}

        {joinRequests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3"
          >
            <div>
              <div className="text-xs text-muted-foreground">조직 가입 신청</div>
              <div className="text-sm font-medium text-foreground">
                {req.organizations?.name ?? "알 수 없는 조직"} ({req.organizations?.university_name ?? ""})
              </div>
              <div className="text-xs text-muted-foreground">
                신청일: {new Date(req.created_at).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <div>{getStatusBadge(req.status)}</div>
          </div>
        ))}
      </div>

      {creationRequests.some((r) => r.status === "approved") || joinRequests.some((r) => r.status === "approved") ? (
        <Button asChild className="w-full mt-2">
          <a href="/dashboard">대시보드로 이동</a>
        </Button>
      ) : null}
    </div>
  );
}

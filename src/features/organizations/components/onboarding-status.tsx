"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeSubscription } from "@/lib/supabase/realtime";

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
  userId,
}: {
  creationRequests: CreationRequest[];
  joinRequests: JoinRequest[];
  userId: string | null;
}) {
  const router = useRouter();
  const [approvedNotice, setApprovedNotice] = useState<string | null>(null);

  // Realtime subscription for Join Requests
  useRealtimeSubscription<{ id: string; requester_id: string; status: string }>({
    table: "organization_join_requests",
    filter: userId ? `requester_id=eq.${userId}` : undefined,
    enabled: Boolean(userId),
    onChange: (payload) => {
      const row = payload.new as { status?: string };
      if (row?.status === "approved") {
        setApprovedNotice("🎉 가입 신청이 승인되었습니다! 대시보드로 이동합니다...");
      } else {
        router.refresh();
      }
    },
  });

  // Realtime subscription for Creation Requests
  useRealtimeSubscription<{ id: string; requester_id: string; status: string }>({
    table: "organization_creation_requests",
    filter: userId ? `requester_id=eq.${userId}` : undefined,
    enabled: Boolean(userId),
    onChange: (payload) => {
      const row = payload.new as { status?: string };
      if (row?.status === "approved") {
        setApprovedNotice("🎉 학생회 조직 생성이 승인되었습니다! 대시보드로 이동합니다...");
      } else {
        router.refresh();
      }
    },
  });

  useEffect(() => {
    if (approvedNotice) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [approvedNotice, router]);

  if (creationRequests.length === 0 && joinRequests.length === 0 && !approvedNotice) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 animate-pulse">심사 중 (실시간)</span>;
      case "approved":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 font-semibold">승인됨</span>;
      case "rejected":
        return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">반려됨</span>;
      default:
        return <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      {approvedNotice && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <PartyPopper className="size-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-emerald-900">축하합니다!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">{approvedNotice}</p>
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => { router.push("/dashboard"); }}
            >
              지금 이동 <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">내 신청 현황</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          실시간 연동 중
        </span>
      </div>

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
          <a href="/dashboard">
            대시보드로 이동 <CheckCircle2 className="size-4 ml-1.5" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

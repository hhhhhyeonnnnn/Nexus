"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveOrganizationCreation, rejectOrganizationCreation } from "@/features/organizations/actions";

type RequestItem = {
  id: string;
  org_name: string;
  university_name: string;
  reason: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  } | null;
};

export function CreationRequestsTable({ requests }: { requests: RequestItem[] }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    if (!confirm("이 조직 생성을 승인하시겠습니까? 신청자가 조직 대표(PRESIDENT)로 등록됩니다.")) return;
    startTransition(async () => {
      const res = await approveOrganizationCreation(id);
      if (res.error) alert(res.error);
    });
  };

  const handleReject = (id: string) => {
    if (!confirm("이 조직 생성을 거부하시겠습니까?")) return;
    startTransition(async () => {
      const res = await rejectOrganizationCreation(id);
      if (res.error) alert(res.error);
    });
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        대기 중인 조직 생성 신청이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">대학교 / 학생회명</th>
              <th className="px-4 py-3">신청자</th>
              <th className="px-4 py-3">신청 사유</th>
              <th className="px-4 py-3">신청 일시</th>
              <th className="px-4 py-3 text-right">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">
                  <div>{req.org_name}</div>
                  <div className="text-xs text-muted-foreground">{req.university_name}</div>
                </td>
                <td className="px-4 py-3 text-foreground">
                  <div>{req.profiles?.name ?? "알 수 없음"}</div>
                  <div className="text-xs text-muted-foreground">{req.profiles?.email}</div>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                  {req.reason || "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(req.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="default"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs"
                      onClick={() => handleApprove(req.id)}
                      disabled={isPending}
                    >
                      승인
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 h-8 text-xs"
                      onClick={() => handleReject(req.id)}
                      disabled={isPending}
                    >
                      거부
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

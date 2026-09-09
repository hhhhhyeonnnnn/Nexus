"use client";

import { useTransition, useState } from "react";
import { Check, X, Clock, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveJoinRequest,
  rejectJoinRequest,
  type PendingJoinRequestItem,
} from "@/features/organizations/actions";

interface JoinRequestItemProps {
  request: PendingJoinRequestItem;
}

export function JoinRequestItem({ request }: JoinRequestItemProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApprove = () => {
    if (!confirm(`${request.name}님의 가입 신청을 승인하시겠습니까?`)) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await approveJoinRequest(request.id);
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const handleReject = () => {
    if (!confirm(`${request.name}님의 가입 신청을 반려하시겠습니까?`)) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await rejectJoinRequest(request.id);
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const createdDate = request.createdAt
    ? new Date(request.createdAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary font-bold text-sm">
            {request.name.slice(0, 1) || "신"}
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">{request.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail size={12} />
              <span>{request.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Clock size={12} />
          <span>신청일: {createdDate}</span>
        </div>
      </div>

      {request.message && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-foreground">
          <MessageSquare size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="whitespace-pre-wrap">{request.message}</p>
        </div>
      )}

      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleReject}
          className="text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
        >
          <X size={14} />
          <span>반려</span>
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={handleApprove}
          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
        >
          <Check size={14} />
          <span>가입 승인</span>
        </Button>
      </div>
    </div>
  );
}

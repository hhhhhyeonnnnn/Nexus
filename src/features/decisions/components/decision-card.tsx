"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, FolderKanban, FileText, Trash2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDecision, type DecisionWithContext } from "@/features/decisions/actions";
import { EditDecisionDialog } from "./edit-decision-dialog";

interface DecisionCardProps {
  decision: DecisionWithContext;
  projects: Array<{ id: string; name: string }>;
  meetings?: Array<{ id: string; title: string }>;
  isAdmin: boolean;
}

export function DecisionCard({
  decision,
  projects,
  meetings = [],
  isAdmin,
}: DecisionCardProps) {
  const [isPending, startTransition] = useTransition();

  const formattedDate = new Date(decision.decided_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDelete = () => {
    if (!confirm(`'${decision.title}' 결정사항을 삭제하시겠습니까?`)) {
      return;
    }
    startTransition(async () => {
      await deleteDecision(decision.id, decision.meeting_id);
    });
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4.5 shadow-2xs hover:border-border/80 hover:shadow-xs transition-all">
      <div>
        {/* Header: Date, Tags & Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Calendar size={12} className="text-muted-foreground/70" />
              <span>{formattedDate}</span>
            </span>

            {decision.projectName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                <FolderKanban size={11} />
                <span>{decision.projectName}</span>
              </span>
            )}

            {decision.meetingTitle && decision.meeting_id && (
              <Link
                href={`/meetings/${decision.meeting_id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50 transition-colors"
                title="해당 회의록 보기"
              >
                <FileText size={11} />
                <span className="truncate max-w-[130px]">{decision.meetingTitle}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <EditDecisionDialog
              decision={decision}
              projects={projects}
              meetings={meetings}
            />
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="결정사항 삭제"
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </div>

        {/* Decision Title */}
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{decision.title}</span>
        </h3>

        {/* Decision Content Box */}
        <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">
          {decision.content}
        </div>

        {/* Reason / Background */}
        {decision.reason && (
          <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <HelpCircle size={13} className="shrink-0 text-muted-foreground/60 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-foreground/80">결정 배경: </span>
              <span>{decision.reason}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

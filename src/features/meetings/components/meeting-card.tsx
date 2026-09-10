"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Calendar, Users, FolderKanban, CheckCircle2, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMeeting, type MeetingWithStats } from "@/features/meetings/actions";

interface MeetingCardProps {
  meeting: MeetingWithStats;
  isAdmin: boolean;
}

export function MeetingCard({ meeting, isAdmin }: MeetingCardProps) {
  const [isPending, startTransition] = useTransition();

  const formattedDate = new Date(meeting.meeting_date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`'${meeting.title}' 회의록을 삭제하시겠습니까?\n회의에 연계된 결정사항도 함께 삭제됩니다.`)) {
      return;
    }
    startTransition(async () => {
      await deleteMeeting(meeting.id);
    });
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4.5 shadow-2xs hover:border-border/80 hover:shadow-xs transition-all">
      <div>
        {/* Header: Date, Project & Decisions Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Calendar size={13} className="text-muted-foreground/70" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {meeting.decisionCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                <CheckCircle2 size={11} />
                <span>결정사항 {meeting.decisionCount}건</span>
              </span>
            )}
            {meeting.projectName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                <FolderKanban size={11} />
                <span>{meeting.projectName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          href={`/meetings/${meeting.id}`}
          className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1"
        >
          {meeting.title}
        </Link>

        {/* Attendees */}
        {meeting.attendees && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users size={12} className="shrink-0 text-muted-foreground/70" />
            <span className="truncate">{meeting.attendees}</span>
          </div>
        )}

        {/* Content Snippet */}
        {meeting.content && (
          <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed whitespace-pre-line">
            {meeting.content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
        <Link
          href={`/meetings/${meeting.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>회의록 상세 및 결정사항</span>
          <ArrowRight size={13} />
        </Link>

        {isAdmin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            title="회의록 삭제"
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>
    </div>
  );
}

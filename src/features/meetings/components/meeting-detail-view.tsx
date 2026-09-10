"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  FolderKanban,
  Trash2,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMeeting, type MeetingWithStats } from "@/features/meetings/actions";
import type { DecisionRow } from "@/features/meetings/actions";
import { EditMeetingDialog } from "./edit-meeting-dialog";
import { AiAnalysisDialog } from "./ai-analysis-dialog";
import { RealtimeSttDialog } from "./realtime-stt-dialog";
import { CreateDecisionDialog } from "@/features/decisions/components/create-decision-dialog";
import { DecisionCard } from "@/features/decisions/components/decision-card";

interface MeetingDetailViewProps {
  meeting: MeetingWithStats;
  decisions: DecisionRow[];
  projects: Array<{ id: string; name: string }>;
  members: Array<{ userId: string; name: string; email: string }>;
  isAdmin: boolean;
}

export function MeetingDetailView({
  meeting,
  decisions,
  projects,
  members,
  isAdmin,
}: MeetingDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // If AI summary exists, collapse raw content by default for higher readability
  const [showRawContent, setShowRawContent] = useState(!meeting.ai_summary);

  const formattedDate = new Date(meeting.meeting_date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = () => {
    if (
      !confirm(
        `'${meeting.title}' 회의록을 삭제하시겠습니까?\n회의에 연계된 결정사항도 함께 삭제됩니다.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteMeeting(meeting.id);
      if (res.success) {
        router.push("/meetings");
      }
    });
  };

  const formattedDecisions = decisions.map((d) => ({
    ...d,
    projectName: meeting.projectName,
    meetingTitle: meeting.title,
  }));

  const rawContentLength = meeting.content ? meeting.content.length : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
      >
        <ArrowLeft size={14} />
        <span>회의록 목록으로 돌아가기</span>
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Calendar size={13} className="text-muted-foreground/70" />
                <span>{formattedDate}</span>
              </span>

              {meeting.projectName && (
                <Link
                  href={`/projects/${meeting.project_id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50 transition-colors"
                >
                  <FolderKanban size={12} />
                  <span>{meeting.projectName}</span>
                </Link>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {meeting.title}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <RealtimeSttDialog
              meetingId={meeting.id}
              meetingTitle={meeting.title}
              hasExistingContent={!!meeting.content && meeting.content.trim().length > 0}
              buttonLabel="실시간 음성 기록"
              buttonVariant="outline"
            />
            <AiAnalysisDialog
              meetingId={meeting.id}
              projectId={meeting.project_id}
              hasExistingSummary={!!meeting.ai_summary}
              members={members}
            />
            <EditMeetingDialog meeting={meeting} projects={projects} />
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="gap-1.5 text-xs h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200"
              >
                <Trash2 size={13} />
                <span>삭제</span>
              </Button>
            )}
          </div>
        </div>

        {/* Attendees */}
        {meeting.attendees && (
          <div className="pt-3 border-t border-border flex items-start gap-2 text-xs text-muted-foreground">
            <Users size={14} className="shrink-0 text-muted-foreground/70 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-foreground">참석자: </span>
              <span>{meeting.attendees}</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. AI Summary Card (Prominently Presented First) */}
      {meeting.ai_summary && (
        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-50/50 via-card to-indigo-50/30 dark:from-blue-950/25 dark:via-card dark:to-indigo-950/20 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">AI 핵심 안건 요약</h2>
                <p className="text-[11px] text-muted-foreground">
                  회의 내용에서 추출된 핵심 안건 및 논의 결과 요약입니다.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40">
              <CheckCircle2 size={11} />
              <span>검토 완료</span>
            </span>
          </div>

          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans space-y-1">
            {meeting.ai_summary}
          </div>
        </div>
      )}

      {/* 2. Decisions Section (Key Resolutions) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>이 회의에서 도출된 핵심 결정사항 ({decisions.length}건)</span>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              이 회의를 통해 확정된 안건과 의결 사항을 기록하여 다음 기수까지 온전히 전달합니다.
            </p>
          </div>

          <CreateDecisionDialog
            projects={projects}
            defaultMeetingId={meeting.id}
            defaultProjectId={meeting.project_id || undefined}
            buttonLabel="이 회의의 결정사항 추가"
          />
        </div>

        {decisions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-lg">
            <CheckCircle2 className="mx-auto text-muted-foreground/40 mb-2" size={28} />
            <p className="text-xs font-semibold text-foreground">
              아직 등록된 결정사항이 없습니다.
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              회의 결과 확정된 의결 사항을 등록하면 결정사항 아카이브 및 프로젝트에도 자동 연결됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formattedDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                projects={projects}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Raw Meeting Content Section (Collapsible when summary exists) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileText size={16} className="text-primary" />
              <span>회의 원문 기록</span>
            </h2>
            {rawContentLength > 0 && (
              <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border">
                {rawContentLength.toLocaleString("ko-KR")}자
              </span>
            )}
          </div>

          {meeting.ai_summary ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRawContent((prev) => !prev)}
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
            >
              <span>{showRawContent ? "원문 접기" : "원문 보기"}</span>
              {showRawContent ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Button>
          ) : (
            meeting.content && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                상단의 &apos;AI 회의록 분석&apos;으로 요약 및 할 일을 추출할 수 있습니다.
              </span>
            )
          )}
        </div>

        {showRawContent ? (
          meeting.content ? (
            <div className="text-xs text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap p-3.5 bg-muted/30 rounded-lg border border-border/50 max-h-[500px] overflow-y-auto">
              {meeting.content}
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-muted-foreground italic">
                아직 회의 내용이 작성되지 않았습니다. 실시간 음성 기록을 시작하거나 직접 작성해 보세요.
              </p>
              <div className="flex justify-center gap-2">
                <RealtimeSttDialog
                  meetingId={meeting.id}
                  meetingTitle={meeting.title}
                  hasExistingContent={false}
                  buttonLabel="마이크로 실시간 회의 받아적기"
                  buttonVariant="default"
                />
              </div>
            </div>
          )
        ) : (
          <div
            onClick={() => setShowRawContent(true)}
            className="group cursor-pointer rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-center hover:bg-muted/40 hover:border-border transition-colors"
          >
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              회의록 원문이 접혀 있습니다. 클릭하거나 우측 상단 &apos;원문 보기&apos;를 눌러 전체 기록을 확인하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

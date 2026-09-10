"use client";

import { useState, useMemo } from "react";
import { Search, FileText, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { MeetingWithStats } from "@/features/meetings/actions";
import type { DecisionWithContext } from "@/features/decisions/actions";
import { CreateMeetingDialog } from "./create-meeting-dialog";
import { MeetingCard } from "./meeting-card";
import { CreateDecisionDialog } from "@/features/decisions/components/create-decision-dialog";
import { DecisionCard } from "@/features/decisions/components/decision-card";

interface MeetingListViewProps {
  initialMeetings: MeetingWithStats[];
  initialDecisions: DecisionWithContext[];
  projects: Array<{ id: string; name: string }>;
  isAdmin: boolean;
  initialTab?: "meetings" | "decisions";
}

export function MeetingListView({
  initialMeetings,
  initialDecisions,
  projects,
  isAdmin,
  initialTab = "meetings",
}: MeetingListViewProps) {
  const [activeTab, setActiveTab] = useState<"meetings" | "decisions">(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const meetingsOptions = useMemo(() => {
    return initialMeetings.map((m) => ({ id: m.id, title: m.title }));
  }, [initialMeetings]);

  const filteredMeetings = useMemo(() => {
    return initialMeetings.filter((m) => {
      if (selectedProjectId !== "ALL" && m.project_id !== selectedProjectId) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchContent = m.content.toLowerCase().includes(q);
      const matchAttendees = (m.attendees || "").toLowerCase().includes(q);
      const matchProject = (m.projectName || "").toLowerCase().includes(q);

      return matchTitle || matchContent || matchAttendees || matchProject;
    });
  }, [initialMeetings, selectedProjectId, searchQuery]);

  const filteredDecisions = useMemo(() => {
    return initialDecisions.filter((d) => {
      if (selectedProjectId !== "ALL" && d.project_id !== selectedProjectId) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchContent = d.content.toLowerCase().includes(q);
      const matchReason = (d.reason || "").toLowerCase().includes(q);
      const matchProject = (d.projectName || "").toLowerCase().includes(q);
      const matchMeeting = (d.meetingTitle || "").toLowerCase().includes(q);

      return matchTitle || matchContent || matchReason || matchProject || matchMeeting;
    });
  }, [initialDecisions, selectedProjectId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="text-primary" size={22} />
            <span>문서 및 회의록</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            학생회 정기/임시 회의록을 작성하고, 핵심 결정사항(Decisions)을 아카이빙합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "meetings" ? (
            <CreateMeetingDialog projects={projects} />
          ) : (
            <CreateDecisionDialog projects={projects} meetings={meetingsOptions} />
          )}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs: Meetings vs Decisions */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("meetings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "meetings"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText size={14} />
            <span>회의록 목록 ({initialMeetings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("decisions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "decisions"
                ? "bg-emerald-500 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>결정사항 아카이브 ({initialDecisions.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Project Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">전체 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-48 sm:w-56">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "meetings" ? "회의 제목, 안건, 참석자..." : "결정 제목, 내용, 사유..."}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "meetings" ? (
        filteredMeetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <FileText className="mx-auto text-muted-foreground/50 mb-3" size={32} />
            <h3 className="text-sm font-semibold text-foreground">
              {searchQuery || selectedProjectId !== "ALL"
                ? "조건에 일치하는 회의록이 없습니다."
                : "등록된 회의록이 없습니다."}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || selectedProjectId !== "ALL"
                ? "검색어 또는 프로젝트 필터를 변경해 보세요."
                : "새 회의록을 작성하여 안건과 논의 내용을 기록해 보세요."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} isAdmin={isAdmin} />
            ))}
          </div>
        )
      ) : filteredDecisions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CheckCircle2 className="mx-auto text-muted-foreground/50 mb-3" size={32} />
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery || selectedProjectId !== "ALL"
              ? "조건에 일치하는 결정사항이 없습니다."
              : "등록된 핵심 결정사항이 없습니다."}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || selectedProjectId !== "ALL"
              ? "검색어 또는 프로젝트 필터를 변경해 보세요."
              : "회의에서 의결된 중요한 결정사항을 기록하고 다음 기수까지 영구 보존하세요."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              projects={projects}
              meetings={meetingsOptions}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

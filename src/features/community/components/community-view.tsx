"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, MessageSquareQuote, Vote, ExternalLink, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnouncementsTab } from "./announcements-tab";
import { PetitionsTab } from "./petitions-tab";
import { PollsTab } from "./polls-tab";
import type { AnnouncementRow, PetitionRow, PollRow } from "../actions";

interface CommunityViewProps {
  announcements: AnnouncementRow[];
  petitions: PetitionRow[];
  polls: PollRow[];
  isAdmin: boolean;
}

export function CommunityView({
  announcements,
  petitions,
  polls,
  isAdmin,
}: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<"announcements" | "petitions" | "polls">("announcements");

  const pendingPetitionsCount = petitions.filter((p) => p.status === "PENDING").length;
  const activePollsCount = polls.filter((p) => !p.is_closed).length;
  const totalVotesCount = polls.reduce((acc, p) => acc + (p.total_votes || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              학생 소통·피드 허브
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              소통 센터
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            학내 전체 공지사항을 발행하고, 학생 건의함을 심사·답변하며, 캠퍼스 보팅(투표)을 총괄합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/feed" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink size={14} />
              학생용 공개 피드 바로가기
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Megaphone size={15} className="text-primary" />
            <span>발행 공지사항</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5">{announcements.length}건</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            중요 고정 {announcements.filter((a) => a.is_pinned).length}건
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock size={15} className="text-amber-500" />
            <span>답변 대기 건의</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">
            {pendingPetitionsCount}건
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            총 접수 {petitions.length}건 중 미답변
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Vote size={15} className="text-emerald-500" />
            <span>진행 중인 투표</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {activePollsCount}개
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            전체 개설 {polls.length}개
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Users size={15} className="text-blue-500" />
            <span>총 투표 참여 학우</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5">
            {totalVotesCount.toLocaleString()}명
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            실시간 여론 집계 완료
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "announcements"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone size={16} />
            공지사항 관리 ({announcements.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("petitions")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "petitions"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareQuote size={16} />
            학생 건의함 ({petitions.length})
            {pendingPetitionsCount > 0 && (
              <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[10px] font-bold">
                {pendingPetitionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("polls")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "polls"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Vote size={16} />
            캠퍼스 투표 ({polls.length})
          </button>
        </div>
      </div>

      {/* 4. Tab Content Panels */}
      <div>
        {activeTab === "announcements" && (
          <AnnouncementsTab announcements={announcements} isAdmin={isAdmin} />
        )}
        {activeTab === "petitions" && (
          <PetitionsTab petitions={petitions} isAdmin={isAdmin} />
        )}
        {activeTab === "polls" && (
          <PollsTab polls={polls} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}

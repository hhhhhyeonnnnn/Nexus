"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Megaphone,
  MessageSquareQuote,
  Vote,
  Pin,
  CheckCircle2,
  Lock,
  Send,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  submitPublicPetition,
  votePublicPoll,
  type AnnouncementRow,
  type PetitionRow,
  type PollOption,
  type PollRow,
} from "../actions";

interface PublicFeedClientProps {
  organization: { id: string; name: string; university_name: string };
  announcements: AnnouncementRow[];
  petitions: PetitionRow[];
  polls: PollRow[];
}

const CATEGORY_MAP: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  GENERAL: { label: "일반공지", tone: "neutral" },
  ACADEMIC: { label: "학사공지", tone: "accent" },
  EVENT: { label: "행사·축제", tone: "success" },
  FINANCE: { label: "회계·결산", tone: "warning" },
};

export function PublicFeedClient({
  organization,
  announcements,
  petitions,
  polls,
}: PublicFeedClientProps) {
  const [activeTab, setActiveTab] = useState<"announcements" | "petitions" | "polls">("announcements");
  const [isPending, startTransition] = useTransition();

  // Client-side voter ID generated from localStorage
  const [voterId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    let vid = localStorage.getItem("nexus_voter_id");
    if (!vid) {
      vid = "voter_" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("nexus_voter_id", vid);
    }
    return vid;
  });

  const [myVotes, setMyVotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const savedVotes = localStorage.getItem("nexus_my_votes");
    if (savedVotes) {
      try {
        return JSON.parse(savedVotes);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Petition Modal State
  const [isPetitionOpen, setIsPetitionOpen] = useState(false);
  const [petitionTitle, setPetitionTitle] = useState("");
  const [petitionContent, setPetitionContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [petitionError, setPetitionError] = useState<string | null>(null);
  const [petitionSuccess, setPetitionSuccess] = useState(false);

  // Poll Vote Error
  const [voteError, setVoteError] = useState<string | null>(null);

  const handleSubmitPetition = (e: React.FormEvent) => {
    e.preventDefault();
    setPetitionError(null);

    startTransition(async () => {
      const res = await submitPublicPetition({
        organization_id: organization.id,
        title: petitionTitle,
        content: petitionContent,
        author_name: authorName,
        student_id: studentId,
        is_secret: isSecret,
      });

      if (res.error) {
        setPetitionError(res.error);
      } else {
        setPetitionSuccess(true);
        setTimeout(() => {
          setIsPetitionOpen(false);
          setPetitionSuccess(false);
          setPetitionTitle("");
          setPetitionContent("");
          setAuthorName("");
          setStudentId("");
          setIsSecret(false);
        }, 1500);
      }
    });
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!voterId) return;
    setVoteError(null);

    startTransition(async () => {
      const res = await votePublicPoll(pollId, organization.id, voterId, optionId);
      if (res.error) {
        setVoteError(res.error);
      } else {
        const updated = { ...myVotes, [pollId]: optionId };
        setMyVotes(updated);
        localStorage.setItem("nexus_my_votes", JSON.stringify(updated));
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Header Bar */}
      <header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              N
            </span>
            <div>
              <span className="block font-bold text-xs text-foreground">
                {organization.university_name} {organization.name}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                학생회 공식 소통 센터
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            학생회 관리자 로그인
            <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {organization.name} 캠퍼스 피드
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              학우 여러분을 위한 실시간 공지, 익명 건의함, 그리고 캠퍼스 투표 공간입니다.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsPetitionOpen(true)}
            className="gap-1.5 text-xs self-start sm:self-auto shrink-0"
          >
            <Plus size={14} />
            학생회에 건의하기
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "announcements"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone size={16} />
            공지사항 ({announcements.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("petitions")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "petitions"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareQuote size={16} />
            학우 건의함 ({petitions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("polls")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "polls"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Vote size={16} />
            캠퍼스 투표 ({polls.length})
          </button>
        </div>

        {/* Tab 1: Announcements */}
        {activeTab === "announcements" && (
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-xs">
                게시된 공지사항이 없습니다.
              </div>
            ) : (
              announcements.map((item) => {
                const catInfo = CATEGORY_MAP[item.category] || { label: item.category, tone: "neutral" as const };
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border bg-card p-5 transition-shadow hover:shadow-xs ${
                      item.is_pinned ? "border-primary/40 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {item.is_pinned && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Pin size={11} className="fill-current" />
                          중요
                        </span>
                      )}
                      <StatusChip tone={catInfo.tone}>{catInfo.label}</StatusChip>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {new Date(item.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-foreground mb-2">{item.title}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Petitions */}
        {activeTab === "petitions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                학우분들의 소중한 의견과 학생회 공식 답변 내역입니다.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPetitionOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Plus size={13} />
                의견 남기기
              </Button>
            </div>

            {petitions.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-xs">
                등록된 공개 건의사항이 없습니다. 먼저 건의를 남겨보세요!
              </div>
            ) : (
              <div className="space-y-3">
                {petitions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border bg-card p-4.5 transition-shadow hover:shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StatusChip tone={item.status === "ANSWERED" ? "success" : "neutral"}>
                          {item.status === "ANSWERED" ? "답변 완료" : "접수 완료"}
                        </StatusChip>
                        <span className="text-muted-foreground">
                          작성자: <strong className="text-foreground">{item.author_name}</strong>
                        </span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(item.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>

                    {item.official_answer && (
                      <div className="rounded-lg bg-muted/40 border p-3 text-xs space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 font-semibold text-primary">
                          <CheckCircle2 size={13} />
                          <span>학생회 공식 답변</span>
                          {item.answered_at && (
                            <span className="text-[11px] text-muted-foreground font-normal ml-auto">
                              {new Date(item.answered_at).toLocaleDateString("ko-KR")}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                          {item.official_answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Polls */}
        {activeTab === "polls" && (
          <div className="space-y-4">
            {voteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {voteError}
              </div>
            )}

            {polls.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-xs">
                현재 진행 중인 캠퍼스 투표가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {polls.map((item) => {
                  const rawOptions = (item.options as unknown as PollOption[]) || [];
                  const total = item.total_votes || 0;
                  const votedOptionId = myVotes[item.id];
                  const hasVoted = Boolean(votedOptionId);

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <StatusChip tone={item.is_closed ? "neutral" : "success"}>
                            {item.is_closed ? "투표 종료" : "진행 중"}
                          </StatusChip>
                          <span className="text-muted-foreground">
                            총 {total.toLocaleString()}명 참여
                          </span>
                        </div>

                        <div>
                          <h3 className="font-semibold text-base text-foreground mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>

                        {/* Options Buttons / Progress */}
                        <div className="space-y-2 pt-1">
                          {rawOptions.map((opt) => {
                            const count = opt.vote_count || 0;
                            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                            const isMyChoice = votedOptionId === opt.id;

                            if (hasVoted || item.is_closed) {
                              return (
                                <div
                                  key={opt.id}
                                  className={`rounded-lg border p-2.5 space-y-1.5 transition-colors ${
                                    isMyChoice ? "border-primary bg-primary/5" : "bg-muted/30"
                                  }`}
                                >
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className="flex items-center gap-1.5 text-foreground">
                                      {opt.text}
                                      {isMyChoice && (
                                        <span className="text-[10px] font-bold text-primary">
                                          (내 투표)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-muted-foreground font-semibold">
                                      {percent}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isMyChoice ? "bg-primary" : "bg-muted-foreground/40"
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isPending}
                                onClick={() => handleVote(item.id, opt.id)}
                                className="w-full rounded-lg border bg-background hover:bg-muted/60 p-2.5 text-left text-xs font-medium transition-colors flex items-center justify-between"
                              >
                                <span>{opt.text}</span>
                                <span className="text-xs text-primary font-semibold">선택</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {hasVoted && (
                        <p className="text-[11px] text-primary font-medium text-center pt-3 border-t mt-3">
                          ✓ 소중한 의견이 반영되었습니다.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Petition Modal */}
      {isPetitionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-semibold">학생회 건의사항 작성</h2>
              <button
                type="button"
                onClick={() => setIsPetitionOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {petitionError && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {petitionError}
              </div>
            )}

            {petitionSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="mx-auto text-emerald-500 size-10" />
                <h3 className="font-semibold text-sm">건의사항이 안전하게 접수되었습니다!</h3>
                <p className="text-xs text-muted-foreground">학생회가 검토 후 성실히 답변하겠습니다.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPetition} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium mb-1 text-foreground">건의 제목 *</label>
                  <input
                    type="text"
                    required
                    value={petitionTitle}
                    onChange={(e) => setPetitionTitle(e.target.value)}
                    placeholder="건의 요점을 간단히 적어주세요."
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1 text-foreground">작성자명 (선택)</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="미입력 시 '익명 학우'"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-foreground">학번 (선택)</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="예: 20261234"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-foreground">건의 내용 *</label>
                  <textarea
                    required
                    rows={4}
                    value={petitionContent}
                    onChange={(e) => setPetitionContent(e.target.value)}
                    placeholder="건의 사항, 불편했던 점, 개선 제안을 자세히 적어주세요."
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isSecret"
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="isSecret" className="text-xs cursor-pointer select-none flex items-center gap-1">
                    <Lock size={11} />
                    비밀글로 등록 (학생회 담당자만 열람 가능)
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPetitionOpen(false)}
                    disabled={isPending}
                  >
                    취소
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                    <Send size={13} />
                    {isPending ? "접수 중..." : "건의 접수하기"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

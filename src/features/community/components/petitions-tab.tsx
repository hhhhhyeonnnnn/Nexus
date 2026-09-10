"use client";

import { useState, useTransition } from "react";
import { MessageSquareQuote, Lock, CheckCircle2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  answerPetition,
  deletePetition,
  type PetitionRow,
} from "../actions";

interface PetitionsTabProps {
  petitions: PetitionRow[];
  isAdmin: boolean;
}

const STATUS_MAP: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "destructive" }> = {
  PENDING: { label: "접수 대기", tone: "neutral" },
  IN_REVIEW: { label: "검토 중", tone: "accent" },
  ANSWERED: { label: "답변 완료", tone: "success" },
  REJECTED: { label: "반려/기각", tone: "destructive" },
};

export function PetitionsTab({ petitions, isAdmin }: PetitionsTabProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedPetition, setSelectedPetition] = useState<PetitionRow | null>(null);
  const [officialAnswer, setOfficialAnswer] = useState("");
  const [answerStatus, setAnswerStatus] = useState<"PENDING" | "IN_REVIEW" | "ANSWERED" | "REJECTED">("ANSWERED");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredPetitions = petitions.filter((p) => {
    if (filter === "ALL") return true;
    return p.status === filter;
  });

  const handleOpenAnswerModal = (petition: PetitionRow) => {
    setSelectedPetition(petition);
    setOfficialAnswer(petition.official_answer || "");
    setAnswerStatus((petition.status as "PENDING" | "IN_REVIEW" | "ANSWERED" | "REJECTED") || "ANSWERED");
    setErrorMsg(null);
  };

  const handleSaveAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetition) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await answerPetition(selectedPetition.id, officialAnswer, answerStatus);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSelectedPetition(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("이 건의사항을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deletePetition(id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PENDING", "IN_REVIEW", "ANSWERED", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === st
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {st === "ALL" ? "전체 건의" : STATUS_MAP[st]?.label ?? st}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          총 {petitions.length}건의 학우 의견 접수
        </p>
      </div>

      {/* Petitions List */}
      {filteredPetitions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <MessageSquareQuote className="mx-auto mb-3 text-muted-foreground/50" size={32} />
          <p className="font-medium text-sm">해당 상태의 건의사항이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPetitions.map((item) => {
            const statusInfo = STATUS_MAP[item.status] || { label: item.status, tone: "neutral" as const };
            return (
              <div
                key={item.id}
                className="rounded-xl border bg-card p-4.5 transition-shadow hover:shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusChip tone={statusInfo.tone}>{statusInfo.label}</StatusChip>
                    {item.is_secret && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Lock size={10} />
                        비밀글
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      작성자: <strong className="text-foreground">{item.author_name}</strong>
                      {item.student_id ? ` (${item.student_id})` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(item.created_at).toLocaleDateString("ko-KR")}</span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAnswerModal(item)}
                      className="h-7 text-xs px-2.5 ml-2"
                    >
                      {item.official_answer ? "답변 수정" : "답변 작성"}
                    </Button>

                    {isAdmin && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-sm text-destructive hover:bg-destructive/10 transition-colors"
                        title="건의 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                    {item.content}
                  </p>
                </div>

                {item.official_answer && (
                  <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1 mt-2">
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
            );
          })}
        </div>
      )}

      {/* Answer Modal */}
      {selectedPetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-semibold">학생 건의 답변 작성 및 심사</h2>
              <button
                type="button"
                onClick={() => setSelectedPetition(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-foreground">[{selectedPetition.title}]</p>
              <p className="text-muted-foreground whitespace-pre-line">{selectedPetition.content}</p>
              <p className="text-[11px] text-muted-foreground/80 pt-1">
                작성자: {selectedPetition.author_name} {selectedPetition.student_id ? `(${selectedPetition.student_id})` : ""}
              </p>
            </div>

            <form onSubmit={handleSaveAnswer} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1 text-foreground">처리 상태 변경</label>
                <select
                  value={answerStatus}
                  onChange={(e) => setAnswerStatus(e.target.value as "PENDING" | "IN_REVIEW" | "ANSWERED" | "REJECTED")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="IN_REVIEW">검토 중</option>
                  <option value="ANSWERED">답변 완료</option>
                  <option value="REJECTED">반려/기각</option>
                  <option value="PENDING">접수 대기</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-foreground">학생회 공식 답변 *</label>
                <textarea
                  required
                  rows={5}
                  value={officialAnswer}
                  onChange={(e) => setOfficialAnswer(e.target.value)}
                  placeholder="학우에게 전달할 공식 답변 및 조치 계획을 친절하게 작성해 주세요."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPetition(null)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                  <Send size={13} />
                  {isPending ? "저장 중..." : "답변 게시"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Vote, Plus, Trash2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  closePoll,
  createPoll,
  deletePoll,
  type PollOption,
  type PollRow,
} from "../actions";

interface PollsTabProps {
  polls: PollRow[];
  isAdmin: boolean;
}

export function PollsTab({ polls, isAdmin }: PollsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create poll state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["찬성", "반대"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createPoll({
        title,
        description,
        options,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setOptions(["찬성", "반대"]);
        setExpiresAt("");
      }
    });
  };

  const handleClosePoll = (id: string) => {
    if (!confirm("이 투표를 조기 마감하시겠습니까? 더 이상 참여할 수 없게 됩니다.")) return;
    startTransition(async () => {
      await closePoll(id);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("이 투표를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deletePoll(id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          학우들의 실시간 여론과 의견을 수렴하는 캠퍼스 보팅 시스템
        </p>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 text-xs"
        >
          <Plus size={15} />
          새 투표 개설
        </Button>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Vote className="mx-auto mb-3 text-muted-foreground/50" size={32} />
          <p className="font-medium text-sm">개설된 투표가 없습니다.</p>
          <p className="text-xs mt-1">학우들의 의견을 모을 투표 안건을 개설해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {polls.map((item) => {
            const rawOptions = (item.options as unknown as PollOption[]) || [];
            const total = item.total_votes || 0;

            return (
              <div
                key={item.id}
                className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusChip tone={item.is_closed ? "neutral" : "success"}>
                      {item.is_closed ? "투표 마감" : "진행 중"}
                    </StatusChip>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>총 {total.toLocaleString()}명 참여</span>

                      {!item.is_closed && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleClosePoll(item.id)}
                          className="p-1 rounded-sm text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="투표 마감"
                        >
                          <StopCircle size={15} />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded-sm text-destructive hover:bg-destructive/10 transition-colors"
                          title="투표 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base text-foreground mb-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  {/* Options Progress Bar */}
                  <div className="space-y-2 pt-1">
                    {rawOptions.map((opt) => {
                      const count = opt.vote_count || 0;
                      const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-foreground">{opt.text}</span>
                            <span className="text-muted-foreground">
                              {count.toLocaleString()}표 ({percent}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t mt-4 text-[11px] text-muted-foreground flex justify-between">
                  <span>개설일: {new Date(item.created_at).toLocaleDateString("ko-KR")}</span>
                  {item.expires_at && (
                    <span>
                      마감일: {new Date(item.expires_at).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-semibold">새 캠퍼스 투표 개설</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
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

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-foreground">투표 안건 제목 *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2026학년도 축제 초청 가수 선호도 조사"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-foreground">안건 설명 및 안내</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="학우들이 투표할 때 참고할 세부 안내 사항을 입력해 주세요."
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-foreground">선택지 목록 (2~6개) *</label>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs text-primary hover:underline"
                    >
                      + 선택지 추가
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`선택지 ${idx + 1}`}
                        className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-foreground">마감 일시 (선택)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "개설 중..." : "투표 시작"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

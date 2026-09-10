"use client";

import { useState, useTransition } from "react";
import { Plus, Pin, Eye, Trash2, Megaphone, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  type AnnouncementRow,
} from "../actions";

interface AnnouncementsTabProps {
  announcements: AnnouncementRow[];
  isAdmin: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  GENERAL: { label: "일반공지", tone: "neutral" },
  ACADEMIC: { label: "학사공지", tone: "accent" },
  EVENT: { label: "행사·축제", tone: "success" },
  FINANCE: { label: "회계·결산", tone: "warning" },
};

export function AnnouncementsTab({ announcements, isAdmin }: AnnouncementsTabProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New announcement form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"GENERAL" | "ACADEMIC" | "EVENT" | "FINANCE">("GENERAL");
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredAnnouncements = announcements.filter((a) => {
    if (filter === "ALL") return true;
    return a.category === filter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createAnnouncement({
        title,
        content,
        category,
        is_pinned: isPinned,
        is_public: isPublic,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsCreateOpen(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
        setIsPublic(true);
      }
    });
  };

  const handleTogglePin = (id: string, currentPin: boolean) => {
    startTransition(async () => {
      await updateAnnouncement(id, { is_pinned: !currentPin });
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("이 공지사항을 정말 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteAnnouncement(id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "GENERAL", "ACADEMIC", "EVENT", "FINANCE"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === cat
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat === "ALL" ? "전체 보기" : CATEGORY_MAP[cat]?.label ?? cat}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 text-xs"
        >
          <Plus size={15} />
          새 공지 등록
        </Button>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-3 text-muted-foreground/50" size={32} />
          <p className="font-medium text-sm">등록된 공지사항이 없습니다.</p>
          <p className="text-xs mt-1">학우들에게 알릴 첫 번째 공지사항을 작성해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((item) => {
            const catInfo = CATEGORY_MAP[item.category] || { label: item.category, tone: "neutral" as const };
            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-card p-4.5 transition-shadow hover:shadow-xs ${
                  item.is_pinned ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {item.is_pinned && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Pin size={11} className="fill-current" />
                        중요 공지
                      </span>
                    )}
                    <StatusChip tone={catInfo.tone}>{catInfo.label}</StatusChip>
                    {item.is_public ? (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Globe size={11} />
                        전체 공개
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <Lock size={11} />
                        내부 전용
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {item.view_count}회
                    </span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString("ko-KR")}</span>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleTogglePin(item.id, item.is_pinned)}
                      className={`ml-2 p-1 rounded-sm hover:bg-muted transition-colors ${
                        item.is_pinned ? "text-primary" : "text-muted-foreground"
                      }`}
                      title={item.is_pinned ? "고정 해제" : "상단 고정"}
                    >
                      <Pin size={14} className={item.is_pinned ? "fill-current" : ""} />
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-sm text-destructive hover:bg-destructive/10 transition-colors"
                        title="공지 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-base text-foreground mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-semibold">새 공지사항 등록</h2>
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

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1 text-foreground">공지 제목 *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2026학년도 대동제 부스 및 푸드트럭 모집 안내"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-foreground">카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "GENERAL" | "ACADEMIC" | "EVENT" | "FINANCE")}
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="GENERAL">일반공지</option>
                    <option value="ACADEMIC">학사공지</option>
                    <option value="EVENT">행사·축제</option>
                    <option value="FINANCE">회계·결산</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-foreground">공개 설정</label>
                  <select
                    value={isPublic ? "true" : "false"}
                    onChange={(e) => setIsPublic(e.target.value === "true")}
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="true">전체 학우 공개 (/feed)</option>
                    <option value="false">학생회 내부 전용</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-foreground">본문 내용 *</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="공지할 상세 내용을 줄바꿈을 포함하여 자유롭게 입력해 주세요."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isPinned" className="text-xs cursor-pointer select-none">
                  상단 중요 공지로 고정하기
                </label>
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
                  {isPending ? "등록 중..." : "공지 발행"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

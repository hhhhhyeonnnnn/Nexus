"use client";

import { useState, useTransition } from "react";
import { Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMeeting, type MeetingWithStats } from "@/features/meetings/actions";

interface EditMeetingDialogProps {
  meeting: MeetingWithStats;
  projects: Array<{ id: string; name: string }>;
}

export function EditMeetingDialog({ meeting, projects }: EditMeetingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const meetingDateObj = new Date(meeting.meeting_date);
  const localIso = new Date(
    meetingDateObj.getTime() - meetingDateObj.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("meeting_id", meeting.id);
    setError(null);

    startTransition(async () => {
      const res = await updateMeeting({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="gap-1.5 text-xs h-8"
      >
        <Edit2 size={13} />
        <span>회의록 수정</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0 text-left">
          <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">회의록 내용 수정</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor={`edit-meeting-title-${meeting.id}`} className="text-xs font-semibold">
                  회의 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edit-meeting-title-${meeting.id}`}
                  name="title"
                  defaultValue={meeting.title}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-meeting-date-${meeting.id}`} className="text-xs font-semibold">
                    회의 일시 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`edit-meeting-date-${meeting.id}`}
                    name="meeting_date"
                    type="datetime-local"
                    defaultValue={localIso}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`edit-meeting-proj-${meeting.id}`} className="text-xs font-semibold">
                    관련 프로젝트
                  </Label>
                  <select
                    id={`edit-meeting-proj-${meeting.id}`}
                    name="project_id"
                    defaultValue={meeting.project_id || ""}
                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- 전체/일반 회의 --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-meeting-attendees-${meeting.id}`} className="text-xs font-semibold">
                  참석자
                </Label>
                <Input
                  id={`edit-meeting-attendees-${meeting.id}`}
                  name="attendees"
                  defaultValue={meeting.attendees || ""}
                  placeholder="예: 김회장, 이부회장, 박기획국장"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-meeting-content-${meeting.id}`} className="text-xs font-semibold">
                  회의 내용 및 안건
                </Label>
                <textarea
                  id={`edit-meeting-content-${meeting.id}`}
                  name="content"
                  rows={9}
                  defaultValue={meeting.content}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "저장 중..." : "수정 완료"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

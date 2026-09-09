"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  Trash2,
} from "lucide-react";
import { CreateEventDialog } from "./create-event-dialog";
import { deleteEvent, type CalendarMonthData, type EventRow } from "@/features/calendar/actions";

interface CalendarViewProps {
  data: CalendarMonthData;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarView({ data }: CalendarViewProps) {
  const router = useRouter();
  const { year, month, events, tasks, projects, availableProjects } = data;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Navigation handlers
  const handlePrevMonth = () => {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear--;
    }
    router.push(`/calendar?year=${prevYear}&month=${prevMonth}`);
  };

  const handleNextMonth = () => {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    router.push(`/calendar?year=${nextYear}&month=${nextMonth}`);
  };

  const handleToday = () => {
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    setSelectedDateStr(todayStr);
    router.push(`/calendar?year=${curYear}&month=${curMonth}`);
  };

  const handleDeleteEvent = (event: EventRow) => {
    if (!confirm(`'${event.title}' 일정을 삭제하시겠습니까?`)) return;
    startDeleteTransition(async () => {
      await deleteEvent(event.id);
    });
  };

  // Build days for the month grid
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 (Sun) ~ 6 (Sat)
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  // Helper maps for date items
  const eventsByDate = new Map<string, EventRow[]>();
  for (const ev of events) {
    const evDate = new Date(ev.start_at).toLocaleDateString("en-CA"); // YYYY-MM-DD
    const existing = eventsByDate.get(evDate) ?? [];
    existing.push(ev);
    eventsByDate.set(evDate, existing);
  }

  const tasksByDate = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const existing = tasksByDate.get(t.dueDate) ?? [];
    existing.push(t);
    tasksByDate.set(t.dueDate, existing);
  }

  // Selected date items
  const selectedDayEvents = eventsByDate.get(selectedDateStr) ?? [];
  const selectedDayTasks = tasksByDate.get(selectedDateStr) ?? [];
  const selectedDayProjects = projects.filter((p) => {
    const start = p.startDate ?? "1970-01-01";
    const end = p.endDate ?? "2099-12-31";
    return start <= selectedDateStr && end >= selectedDateStr;
  });

  const totalSelectedItems =
    selectedDayEvents.length + selectedDayTasks.length + selectedDayProjects.length;

  return (
    <div className="space-y-6">
      {/* Header & Month Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {year}년 {month}월
          </h1>
          <div className="flex items-center gap-1 border border-border rounded-lg bg-card p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="다음 달"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-2">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              행사·일정
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              프로젝트
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              업무 마감
            </span>
          </div>

          <CreateEventDialog projects={availableProjects} defaultDate={selectedDateStr} />
        </div>
      </div>

      {/* Main Grid + Day Detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar Grid (3 cols on large) */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2.5">
            {WEEKDAYS.map((w, idx) => (
              <div key={w} className={idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : ""}>
                {w}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
            {/* Previous month filler */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const prevDay = prevMonthDays - firstDayOfWeek + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-24 p-2 text-xs text-muted-foreground/35 bg-muted/10 pointer-events-none"
                >
                  <span>{prevDay}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;
              const dayOfWeek = (firstDayOfWeek + i) % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              const dayEvents = eventsByDate.get(dateStr) ?? [];
              const dayTasks = tasksByDate.get(dateStr) ?? [];
              const dayProjects = projects.filter((p) => {
                const start = p.startDate ?? "1970-01-01";
                const end = p.endDate ?? "2099-12-31";
                return start <= dateStr && end >= dateStr;
              });

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-24 p-1.5 cursor-pointer transition-colors flex flex-col justify-between ${
                    isSelected
                      ? "bg-primary/10 ring-2 ring-primary/60 inset-ring-2"
                      : "hover:bg-muted/40"
                  } ${isToday && !isSelected ? "bg-muted/20" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`size-6 flex items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : isSunday
                            ? "text-red-500"
                            : isSaturday
                              ? "text-blue-500"
                              : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    {(dayEvents.length > 0 || dayTasks.length > 0) && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {dayEvents.length + dayTasks.length}건
                      </span>
                    )}
                  </div>

                  {/* Day Badges list (max 3, plus overflow count) */}
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate rounded-xs bg-primary/15 px-1 py-0.5 text-[10px] font-medium text-primary"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}

                    {dayProjects.slice(0, 1).map((p) => (
                      <div
                        key={p.id}
                        className="truncate rounded-xs bg-blue-500/15 px-1 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400"
                        title={`프로젝트: ${p.name}`}
                      >
                        📁 {p.name}
                      </div>
                    ))}

                    {dayTasks.slice(0, 1).map((t) => (
                      <div
                        key={t.id}
                        className={`truncate rounded-xs px-1 py-0.5 text-[10px] font-medium ${
                          t.status === "DONE"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 line-through opacity-70"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                        title={`업무: ${t.title}`}
                      >
                        ✓ {t.title}
                      </div>
                    ))}

                    {dayEvents.length + dayProjects.length + dayTasks.length > 3 && (
                      <span className="text-[9px] text-muted-foreground pl-1">
                        +{dayEvents.length + dayProjects.length + dayTasks.length - 3}개 더보기
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {selectedDateStr === todayStr
                    ? `오늘 (${selectedDateStr})`
                    : `${selectedDateStr} 일정`}
                </h3>
                <p className="text-xs text-muted-foreground">총 {totalSelectedItems}건의 일정</p>
              </div>
              <CalendarDays className="size-4 text-primary" />
            </div>

            {totalSelectedItems === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                이 날짜에는 등록된 일정이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Events */}
                {selectedDayEvents.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      학생회 행사 ({selectedDayEvents.length})
                    </p>
                    {selectedDayEvents.map((ev) => {
                      const startTime = new Date(ev.start_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });
                      const endTime = new Date(ev.end_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                      return (
                        <div
                          key={ev.id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{ev.title}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Clock className="size-3 shrink-0" />
                              <span>
                                {startTime} ~ {endTime}
                              </span>
                            </div>
                            {ev.projects && (
                              <p className="text-[10px] text-primary truncate">
                                ↳ {ev.projects.name}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteEvent(ev)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-sm"
                            title="일정 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Projects */}
                {selectedDayProjects.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      진행 프로젝트 ({selectedDayProjects.length})
                    </p>
                    {selectedDayProjects.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-xs"
                      >
                        <Folder className="size-3.5 text-blue-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.startDate ?? "미정"} ~ {p.endDate ?? "미정"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {selectedDayTasks.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      마감 업무 ({selectedDayTasks.length})
                    </p>
                    {selectedDayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-xs"
                      >
                        <CheckCircle2
                          className={`size-3.5 shrink-0 ${
                            t.status === "DONE" ? "text-emerald-500" : "text-amber-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-semibold text-foreground truncate ${
                              t.status === "DONE" ? "line-through opacity-70" : ""
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.projectName && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {t.projectName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

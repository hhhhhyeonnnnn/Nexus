"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  ListChecks,
  Gavel,
  FileText,
  AlertCircle,
  Save,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  analyzeMeetingAction,
  saveMeetingAiSummary,
  batchCreateTasksFromMeeting,
  batchCreateDecisionsFromMeeting,
} from "@/features/meetings/actions";

interface MemberOption {
  userId: string;
  name: string;
  email: string;
}

interface AiAnalysisDialogProps {
  meetingId: string;
  projectId: string | null;
  hasExistingSummary: boolean;
  members: MemberOption[];
}

type TabType = "summary" | "tasks" | "decisions";

interface EditableTaskItem {
  id: string;
  selected: boolean;
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
}

interface EditableDecisionItem {
  id: string;
  selected: boolean;
  title: string;
  content: string;
  reason: string;
}

export function AiAnalysisDialog({
  meetingId,
  projectId,
  hasExistingSummary,
  members,
}: AiAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Analysis result states
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [summarySaved, setSummarySaved] = useState(false);
  const [isSavingSummary, startSaveSummary] = useTransition();

  const [tasks, setTasks] = useState<EditableTaskItem[]>([]);
  const [tasksSavedCount, setTasksSavedCount] = useState<number | null>(null);
  const [isSavingTasks, startSaveTasks] = useTransition();
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [decisions, setDecisions] = useState<EditableDecisionItem[]>([]);
  const [decisionsSavedCount, setDecisionsSavedCount] = useState<number | null>(null);
  const [isSavingDecisions, startSaveDecisions] = useTransition();
  const [decisionsError, setDecisionsError] = useState<string | null>(null);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSummarySaved(false);
    setTasksSavedCount(null);
    setDecisionsSavedCount(null);
    setTasksError(null);
    setDecisionsError(null);

    const res = await analyzeMeetingAction(meetingId);
    setIsAnalyzing(false);

    if (res.error || !res.data) {
      setAnalysisError(res.error || "분석 결과를 불러오지 못했습니다.");
      return;
    }

    setHasAnalyzed(true);
    setEditedSummary(res.data.summary);

    // Populate tasks
    setTasks(
      res.data.tasks.map((t, idx) => ({
        id: `task-${idx}-${Date.now()}`,
        selected: true,
        title: t.title,
        description: t.description,
        dueDate: t.suggestedDueDate || "",
        assigneeId: t.matchedUserId || "",
      })),
    );

    // Populate decisions
    setDecisions(
      res.data.decisions.map((d, idx) => ({
        id: `decision-${idx}-${Date.now()}`,
        selected: true,
        title: d.title,
        content: d.content,
        reason: d.reason,
      })),
    );
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasAnalyzed) {
      handleStartAnalysis();
    }
  };

  const handleSaveSummary = () => {
    if (!editedSummary.trim()) return;
    startSaveSummary(async () => {
      const res = await saveMeetingAiSummary(meetingId, editedSummary);
      if (res.success) {
        setSummarySaved(true);
      } else {
        setAnalysisError(res.error || "요약 저장 실패");
      }
    });
  };

  const handleSaveSelectedTasks = () => {
    const selectedTasks = tasks.filter((t) => t.selected && t.title.trim().length > 0);
    if (selectedTasks.length === 0) {
      setTasksError("선택된 태스크가 없습니다.");
      return;
    }
    setTasksError(null);

    startSaveTasks(async () => {
      const res = await batchCreateTasksFromMeeting(
        meetingId,
        projectId,
        selectedTasks.map((t) => ({
          title: t.title,
          description: t.description,
          dueDate: t.dueDate || null,
          assigneeId: t.assigneeId || null,
        })),
      );

      if (res.success) {
        setTasksSavedCount(res.count ?? selectedTasks.length);
        // Deselect saved tasks
        setTasks((prev) =>
          prev.map((t) => (t.selected ? { ...t, selected: false } : t)),
        );
      } else {
        setTasksError(res.error || "태스크 등록 중 오류가 발생했습니다.");
      }
    });
  };

  const handleSaveSelectedDecisions = () => {
    const selectedDecisions = decisions.filter(
      (d) => d.selected && d.title.trim().length > 0 && d.content.trim().length > 0,
    );
    if (selectedDecisions.length === 0) {
      setDecisionsError("선택된 결정사항이 없습니다 (제목 및 내용 필수).");
      return;
    }
    setDecisionsError(null);

    startSaveDecisions(async () => {
      const res = await batchCreateDecisionsFromMeeting(
        meetingId,
        projectId,
        selectedDecisions.map((d) => ({
          title: d.title,
          content: d.content,
          reason: d.reason,
        })),
      );

      if (res.success) {
        setDecisionsSavedCount(res.count ?? selectedDecisions.length);
        // Deselect saved decisions
        setDecisions((prev) =>
          prev.map((d) => (d.selected ? { ...d, selected: false } : d)),
        );
      } else {
        setDecisionsError(res.error || "결정사항 등록 중 오류가 발생했습니다.");
      }
    });
  };

  const selectedTasksCount = tasks.filter((t) => t.selected).length;
  const selectedDecisionsCount = decisions.filter((d) => d.selected).length;

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 text-xs h-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs border-0"
      >
        <Sparkles size={13} className="text-blue-100" />
        <span>{hasExistingSummary ? "AI 재분석" : "AI 회의록 분석"}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in-0 text-left">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    AI 회의록 분석 및 실행 추출
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    회의록에서 안건 요약, 할 일(Task), 결정사항을 추출하여 검토 후 등록합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {hasAnalyzed && !isAnalyzing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleStartAnalysis}
                    className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    title="회의록 본문으로 다시 분석"
                  >
                    <RotateCcw size={12} />
                    <span className="hidden sm:inline">다시 분석</span>
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Notice Banner */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-semibold">검토 후 명시적 저장 원칙</p>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                    AI 분석 결과는 자동으로 데이터베이스에 저장되지 않습니다. 각 탭에서 내용을 검토하고 원하는 항목을 선택하여 직접 저장하세요.
                  </p>
                </div>
              </div>

              {/* Loading State */}
              {isAnalyzing && (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      회의록을 AI로 정밀 분석하는 중입니다...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      안건 요약, 실행할 업무 후보, 가결된 결정사항을 추출하고 있습니다. (약 3~7초 소요)
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!isAnalyzing && analysisError && (
                <div className="p-6 text-center space-y-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <AlertCircle size={28} className="mx-auto text-destructive" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-destructive">분석 중 문제가 발생했습니다</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{analysisError}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartAnalysis}
                    className="text-xs gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>다시 시도하기</span>
                  </Button>
                </div>
              )}

              {/* Analysis Results Ready */}
              {!isAnalyzing && !analysisError && hasAnalyzed && (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex border-b border-border gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("summary")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === "summary"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText size={14} />
                      <span>안건 요약</span>
                      {summarySaved && (
                        <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("tasks")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === "tasks"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ListChecks size={14} />
                      <span>할 일 후보 ({tasks.length})</span>
                      {tasksSavedCount !== null && (
                        <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("decisions")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === "decisions"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Gavel size={14} />
                      <span>결정사항 후보 ({decisions.length})</span>
                      {decisionsSavedCount !== null && (
                        <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* TAB 1: SUMMARY */}
                  {activeTab === "summary" && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label htmlFor="ai-summary" className="font-semibold text-foreground">
                          AI 생성 안건 요약 (직접 편집 가능)
                        </Label>
                        {summarySaved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            <CheckCircle2 size={13} />
                            <span>회의록 요약 저장됨</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            확인 후 우측 저장 버튼을 누르세요
                          </span>
                        )}
                      </div>

                      <textarea
                        id="ai-summary"
                        value={editedSummary}
                        onChange={(e) => {
                          setEditedSummary(e.target.value);
                          setSummarySaved(false);
                        }}
                        rows={8}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y font-sans"
                        placeholder="요약 내용이 여기에 표시됩니다..."
                      />

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[11px] text-muted-foreground">
                          저장 시 회의록 상세 화면 상단에 AI 핵심 안건 요약 카드로 표시됩니다.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSavingSummary || summarySaved}
                          onClick={handleSaveSummary}
                          className="text-xs h-8 gap-1.5"
                        >
                          {isSavingSummary ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Save size={13} />
                          )}
                          <span>{summarySaved ? "저장 완료" : "회의록 요약 저장"}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TASKS */}
                  {activeTab === "tasks" && (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setTasks((prev) =>
                                prev.map((t) => ({ ...t, selected: !prev.every((p) => p.selected) })),
                              )
                            }
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            {tasks.every((t) => t.selected) ? "전체 해제" : "전체 선택"}
                          </button>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">
                            선택됨: <strong className="text-foreground">{selectedTasksCount}</strong> / {tasks.length}개
                          </span>
                        </div>

                        {tasksSavedCount !== null && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            <CheckCircle2 size={13} />
                            <span>{tasksSavedCount}개 태스크 등록 완료</span>
                          </span>
                        )}
                      </div>

                      {tasksError && (
                        <p className="text-xs text-destructive">{tasksError}</p>
                      )}

                      {tasks.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                          추출된 할 일(Task) 후보가 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tasks.map((task, idx) => (
                            <div
                              key={task.id}
                              className={`rounded-lg border p-3.5 space-y-3 transition-colors ${
                                task.selected
                                  ? "border-primary/40 bg-card shadow-2xs"
                                  : "border-border/60 bg-muted/10 opacity-70"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id={`task-check-${task.id}`}
                                  checked={task.selected}
                                  onChange={(e) =>
                                    setTasks((prev) =>
                                      prev.map((t, i) =>
                                        i === idx ? { ...t, selected: e.target.checked } : t,
                                      ),
                                    )
                                  }
                                  className="size-4 mt-1 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                                />

                                <div className="flex-1 space-y-2 min-w-0">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`task-title-${task.id}`}
                                      className="text-[11px] text-muted-foreground font-medium"
                                    >
                                      업무 제목
                                    </Label>
                                    <Input
                                      id={`task-title-${task.id}`}
                                      value={task.title}
                                      onChange={(e) =>
                                        setTasks((prev) =>
                                          prev.map((t, i) =>
                                            i === idx ? { ...t, title: e.target.value } : t,
                                          ),
                                        )
                                      }
                                      className="text-xs h-8"
                                      placeholder="업무 제목을 입력하세요"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`task-desc-${task.id}`}
                                      className="text-[11px] text-muted-foreground font-medium"
                                    >
                                      상세 설명
                                    </Label>
                                    <textarea
                                      id={`task-desc-${task.id}`}
                                      value={task.description}
                                      onChange={(e) =>
                                        setTasks((prev) =>
                                          prev.map((t, i) =>
                                            i === idx ? { ...t, description: e.target.value } : t,
                                          ),
                                        )
                                      }
                                      rows={2}
                                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                      placeholder="상세 설명이나 맥락..."
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`task-assignee-${task.id}`}
                                        className="text-[11px] text-muted-foreground font-medium"
                                      >
                                        담당자 배정
                                      </Label>
                                      <select
                                        id={`task-assignee-${task.id}`}
                                        value={task.assigneeId}
                                        onChange={(e) =>
                                          setTasks((prev) =>
                                            prev.map((t, i) =>
                                              i === idx ? { ...t, assigneeId: e.target.value } : t,
                                            ),
                                          )
                                        }
                                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs h-8 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                      >
                                        <option value="">담당자 미지정</option>
                                        {members.map((m) => (
                                          <option key={m.userId} value={m.userId}>
                                            {m.name} ({m.email})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`task-due-${task.id}`}
                                        className="text-[11px] text-muted-foreground font-medium"
                                      >
                                        마감일
                                      </Label>
                                      <Input
                                        id={`task-due-${task.id}`}
                                        type="date"
                                        value={task.dueDate}
                                        onChange={(e) =>
                                          setTasks((prev) =>
                                            prev.map((t, i) =>
                                              i === idx ? { ...t, dueDate: e.target.value } : t,
                                            ),
                                          )
                                        }
                                        className="text-xs h-8"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-[11px] text-muted-foreground">
                          선택된 태스크가 실제 학생회 업무(`tasks`)로 등록됩니다.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSavingTasks || selectedTasksCount === 0}
                          onClick={handleSaveSelectedTasks}
                          className="text-xs h-8 gap-1.5"
                        >
                          {isSavingTasks ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <PlusCircle size={13} />
                          )}
                          <span>선택한 태스크 {selectedTasksCount}개 등록</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DECISIONS */}
                  {activeTab === "decisions" && (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDecisions((prev) =>
                                prev.map((d) => ({ ...d, selected: !prev.every((p) => p.selected) })),
                              )
                            }
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            {decisions.every((d) => d.selected) ? "전체 해제" : "전체 선택"}
                          </button>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">
                            선택됨: <strong className="text-foreground">{selectedDecisionsCount}</strong> / {decisions.length}개
                          </span>
                        </div>

                        {decisionsSavedCount !== null && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            <CheckCircle2 size={13} />
                            <span>{decisionsSavedCount}개 결정사항 등록 완료</span>
                          </span>
                        )}
                      </div>

                      {decisionsError && (
                        <p className="text-xs text-destructive">{decisionsError}</p>
                      )}

                      {decisions.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                          추출된 결정사항(Decision) 후보가 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {decisions.map((decision, idx) => (
                            <div
                              key={decision.id}
                              className={`rounded-lg border p-3.5 space-y-3 transition-colors ${
                                decision.selected
                                  ? "border-primary/40 bg-card shadow-2xs"
                                  : "border-border/60 bg-muted/10 opacity-70"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id={`decision-check-${decision.id}`}
                                  checked={decision.selected}
                                  onChange={(e) =>
                                    setDecisions((prev) =>
                                      prev.map((d, i) =>
                                        i === idx ? { ...d, selected: e.target.checked } : d,
                                      ),
                                    )
                                  }
                                  className="size-4 mt-1 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                                />

                                <div className="flex-1 space-y-2 min-w-0">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`decision-title-${decision.id}`}
                                      className="text-[11px] text-muted-foreground font-medium"
                                    >
                                      결정사항 제목
                                    </Label>
                                    <Input
                                      id={`decision-title-${decision.id}`}
                                      value={decision.title}
                                      onChange={(e) =>
                                        setDecisions((prev) =>
                                          prev.map((d, i) =>
                                            i === idx ? { ...d, title: e.target.value } : d,
                                          ),
                                        )
                                      }
                                      className="text-xs h-8"
                                      placeholder="결정사항 제목..."
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`decision-content-${decision.id}`}
                                      className="text-[11px] text-muted-foreground font-medium"
                                    >
                                      결정 내용
                                    </Label>
                                    <textarea
                                      id={`decision-content-${decision.id}`}
                                      value={decision.content}
                                      onChange={(e) =>
                                        setDecisions((prev) =>
                                          prev.map((d, i) =>
                                            i === idx ? { ...d, content: e.target.value } : d,
                                          ),
                                        )
                                      }
                                      rows={2}
                                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                      placeholder="의결/확정된 구체적인 내용..."
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`decision-reason-${decision.id}`}
                                      className="text-[11px] text-muted-foreground font-medium"
                                    >
                                      결정 배경 및 이유 (선택)
                                    </Label>
                                    <Input
                                      id={`decision-reason-${decision.id}`}
                                      value={decision.reason}
                                      onChange={(e) =>
                                        setDecisions((prev) =>
                                          prev.map((d, i) =>
                                            i === idx ? { ...d, reason: e.target.value } : d,
                                          ),
                                        )
                                      }
                                      className="text-xs h-8"
                                      placeholder="결정 배경이나 사유..."
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-[11px] text-muted-foreground">
                          선택된 결정사항이 이 회의록 및 결정사항 아카이브(`decisions`)에 등록됩니다.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSavingDecisions || selectedDecisionsCount === 0}
                          onClick={handleSaveSelectedDecisions}
                          className="text-xs h-8 gap-1.5"
                        >
                          {isSavingDecisions ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <PlusCircle size={13} />
                          )}
                          <span>선택한 결정사항 {selectedDecisionsCount}개 등록</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                저장된 항목은 회의록 상세 페이지에 즉시 반영됩니다.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs h-8"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

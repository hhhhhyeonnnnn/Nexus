"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit3,
  ArrowRight,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSpeechRecognition } from "@/features/meetings/hooks/use-speech-recognition";
import {
  runTranscriptClarification,
  saveTranscriptToMeeting,
} from "@/features/meetings/actions";
import type { ClarificationItem } from "@/lib/ai/clarify-transcript";

interface RealtimeSttDialogProps {
  meetingId: string;
  meetingTitle: string;
  hasExistingContent?: boolean;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost";
}

type DialogStep = "RECORDING" | "REVIEW" | "SAVING";

export function RealtimeSttDialog({
  meetingId,
  meetingTitle,
  hasExistingContent = false,
  buttonLabel = "실시간 음성 기록",
  buttonVariant = "outline",
}: RealtimeSttDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("RECORDING");
  const [saveMode, setSaveMode] = useState<"append" | "replace">(
    hasExistingContent ? "append" : "replace",
  );

  const {
    isSupported,
    isListening,
    isPaused,
    transcript,
    setTranscript,
    interimTranscript,
    errorMessage: sttError,
    duration,
    formattedDuration,
    startListening,
    pauseListening,
    resumeListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // AI clarification states
  const [isAiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<ClarificationItem[]>([]);
  const [clarificationDecisions, setClarificationDecisions] = useState<
    Record<string, { status: "accepted" | "rejected" | "custom"; customValue?: string }>
  >({});
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Full working transcript with interim display
  const combinedLiveText = useMemo(() => {
    const trimmed = transcript.trim();
    const interim = interimTranscript.trim();
    if (!trimmed) return interim;
    if (!interim) return trimmed;
    return `${trimmed} ${interim}`;
  }, [transcript, interimTranscript]);

  // Compute final corrected transcript based on decisions
  const correctedTranscript = useMemo(() => {
    let text = transcript;
    for (const item of clarifications) {
      const decision = clarificationDecisions[item.id];
      if (!decision || decision.status === "accepted") {
        // Replace all occurrences of original snippet with suggestion
        text = text.replaceAll(item.originalSnippet, item.suggestedCorrection);
      } else if (decision.status === "custom" && decision.customValue) {
        text = text.replaceAll(item.originalSnippet, decision.customValue.trim());
      }
      // If rejected, leave as-is
    }
    return text;
  }, [transcript, clarifications, clarificationDecisions]);

  const handleOpen = () => {
    resetTranscript();
    setClarifications([]);
    setClarificationDecisions({});
    setAiError(null);
    setSaveSuccess(false);
    setStep("RECORDING");
    setIsManualEdit(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    stopListening();
    setIsOpen(false);
  };

  // Run AI clarification
  const handleStartClarification = () => {
    stopListening();
    setAiError(null);
    const textToAnalyze = transcript.trim();

    if (!textToAnalyze) {
      setAiError("분석할 음성 기록 내용이 없습니다. 마이크로 발언하거나 텍스트를 입력해 주세요.");
      return;
    }

    startAiTransition(async () => {
      const res = await runTranscriptClarification(meetingId, textToAnalyze);
      if (res.error) {
        setAiError(res.error);
      } else if (res.data) {
        setClarifications(res.data.clarifications);
        // Default all decisions to 'accepted'
        const initialDecisions: Record<
          string,
          { status: "accepted" | "rejected" | "custom" }
        > = {};
        for (const item of res.data.clarifications) {
          initialDecisions[item.id] = { status: "accepted" };
        }
        setClarificationDecisions(initialDecisions);
        setStep("REVIEW");
      }
    });
  };

  // Decision toggles
  const handleDecision = (
    id: string,
    status: "accepted" | "rejected" | "custom",
    customValue?: string,
  ) => {
    setClarificationDecisions((prev) => ({
      ...prev,
      [id]: { status, customValue },
    }));
  };

  const handleAcceptAll = () => {
    const next: Record<string, { status: "accepted" }> = {};
    for (const c of clarifications) {
      next[c.id] = { status: "accepted" };
    }
    setClarificationDecisions(next);
  };

  // Save to meeting content
  const [isSavePending, startSaveTransition] = useTransition();
  const handleSaveToMeeting = () => {
    const finalContent =
      step === "REVIEW" ? correctedTranscript.trim() : transcript.trim();

    if (!finalContent) {
      setAiError("저장할 회의록 내용이 없습니다.");
      return;
    }

    startSaveTransition(async () => {
      const res = await saveTranscriptToMeeting(meetingId, finalContent, saveMode);
      if (res.error) {
        setAiError(res.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary font-medium"
      >
        <Mic className="size-3.5 text-primary" />
        <span>{buttonLabel}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${
                    isListening && !isPaused
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Mic className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>실시간 회의 음성 기록 & AI 문맥 교정</span>
                    {step === "RECORDING" && isListening && !isPaused && (
                      <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold border border-rose-300 dark:border-rose-800">
                        <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                        REC
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-muted-foreground truncate max-w-md">
                    {meetingTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Browser support warning */}
              {!isSupported && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">브라우저 Web Speech API 미지원</p>
                    <p className="mt-0.5 text-[11px]">
                      Chrome, Safari, Edge 브라우저에서 마이크 음성 인식이 지원됩니다. 직접 텍스트를
                      입력하거나 붙여넣어 AI 문맥 교정을 실행할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {sttError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{sttError}</span>
                </div>
              )}

              {aiError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* STEP 1: RECORDING CONTROLS & STREAM */}
              {step === "RECORDING" && (
                <div className="space-y-4">
                  {/* Timer & Main Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
                        {formattedDuration}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isListening && !isPaused
                          ? "회의 발언을 실시간 받아적는 중..."
                          : isPaused
                          ? "기록 일시 정지됨"
                          : "대기 중"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isListening ? (
                        <Button
                          type="button"
                          onClick={startListening}
                          className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <Mic className="size-3.5" />
                          <span>녹음 시작</span>
                        </Button>
                      ) : isPaused ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resumeListening}
                          className="gap-1.5 text-xs"
                        >
                          <Play className="size-3.5 text-emerald-600" />
                          <span>계속 기록</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={pauseListening}
                          className="gap-1.5 text-xs"
                        >
                          <Pause className="size-3.5 text-amber-600" />
                          <span>일시 정지</span>
                        </Button>
                      )}

                      {(transcript || duration > 0) && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={resetTranscript}
                          disabled={isListening && !isPaused}
                          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                          title="기록 초기화"
                        >
                          <RotateCcw className="size-3" />
                          <span>초기화</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Transcript Viewer / Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span className="font-medium">실시간 전사 내용 ({transcript.length}자)</span>
                      <button
                        type="button"
                        onClick={() => setIsManualEdit((prev) => !prev)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="size-3" />
                        <span>{isManualEdit ? "스트림 보기로 전환" : "직접 수정/붙여넣기"}</span>
                      </button>
                    </div>

                    {isManualEdit ? (
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="마이크로 받아적은 내용이 이곳에 표시되거나 직접 텍스트를 입력할 수 있습니다..."
                        rows={8}
                        className="w-full rounded-xl border border-input bg-background p-3.5 text-xs sm:text-sm shadow-inner transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans leading-relaxed"
                      />
                    ) : (
                      <div className="min-h-48 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-4 text-xs sm:text-sm font-sans leading-relaxed shadow-inner">
                        {combinedLiveText ? (
                          <div className="space-y-1">
                            <span className="text-foreground whitespace-pre-wrap">
                              {transcript}
                            </span>
                            {interimTranscript && (
                              <span className="text-muted-foreground/70 italic bg-muted/50 px-1 rounded animate-pulse ml-1">
                                {interimTranscript}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-36 flex-col items-center justify-center text-muted-foreground/60 text-center">
                            <Mic className="size-8 stroke-[1.5] mb-2 text-muted-foreground/40" />
                            <p className="font-medium text-xs">상단의 [녹음 시작] 버튼을 누르고 말씀하세요</p>
                            <p className="text-[11px] mt-0.5">
                              크롬 및 사파리 마이크를 통해 실시간으로 텍스트가 변환됩니다.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: AI CLARIFICATION & INTERACTIVE REVIEW */}
              {step === "REVIEW" && (
                <div className="space-y-5">
                  {/* Summary Banner */}
                  <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xs font-bold text-foreground">
                          AI 학생회 문맥 전사 검토 결과
                        </h3>
                      </div>
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                        {clarifications.length === 0
                          ? "오인식 없음"
                          : `${clarifications.length}건 교정 제안`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      학생회 고유 용어, 행사명, 직책, 부서명을 토대로 발음 유사어 및 음성 왜곡 구간을
                      감지했습니다.
                    </p>
                  </div>

                  {clarifications.length === 0 ? (
                    <div className="rounded-xl border border-emerald-300/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-8 text-center space-y-2">
                      <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-foreground">
                        왜곡이나 오탈자 없이 깨끗하게 전사되었습니다!
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        감지된 발음 오류가 없습니다. 바로 회의록 본문에 저장하실 수 있습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-semibold text-foreground">
                          발견된 의심 항목 ({clarifications.length}건)
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAcceptAll}
                          className="h-7 text-[11px] gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                        >
                          <Check className="size-3" />
                          <span>모든 교정 일괄 수락</span>
                        </Button>
                      </div>

                      <div className="space-y-2.5">
                        {clarifications.map((item, idx) => {
                          const decision = clarificationDecisions[item.id] || {
                            status: "accepted",
                          };
                          const isAccepted = decision.status === "accepted";
                          const isRejected = decision.status === "rejected";

                          return (
                            <div
                              key={item.id}
                              className={`rounded-xl border p-3.5 transition-colors space-y-2.5 ${
                                isAccepted
                                  ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/15"
                                  : isRejected
                                  ? "border-border bg-muted/20 opacity-70"
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap text-xs">
                                    <span className="text-muted-foreground font-semibold">
                                      #{idx + 1}
                                    </span>
                                    {/* Original Snippet */}
                                    <span className="rounded bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.5 font-mono line-through text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                                      {item.originalSnippet}
                                    </span>
                                    <ArrowRight className="size-3 text-muted-foreground" />
                                    {/* Suggested Snippet */}
                                    <span className="rounded bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                      {item.suggestedCorrection}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-muted-foreground">
                                    💡 {item.detectedIssue}
                                  </p>

                                  {item.contextSnippet && (
                                    <p className="text-[11px] text-muted-foreground/80 italic font-mono bg-muted/40 p-1.5 rounded">
                                      &ldquo;...{item.contextSnippet}...&rdquo;
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDecision(item.id, "accepted")}
                                    className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                                      isAccepted
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    교정 적용
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDecision(item.id, "rejected")}
                                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                                      isRejected
                                        ? "bg-muted-foreground/20 text-foreground font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                  >
                                    원문 유지
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Final Corrected Preview */}
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold">최종 교정 반영 전사문 미리보기</Label>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                      {correctedTranscript}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Mode Option (If existing content present) */}
              {hasExistingContent && (
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    기존 회의록 본문 저장 방식
                  </Label>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="save_mode"
                        checked={saveMode === "append"}
                        onChange={() => setSaveMode("append")}
                        className="accent-primary"
                      />
                      <span>기존 본문 뒤에 이어붙이기 (Append)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="save_mode"
                        checked={saveMode === "replace"}
                        onChange={() => setSaveMode("replace")}
                        className="accent-primary"
                      />
                      <span>기존 본문 덮어쓰기 (Replace)</span>
                    </label>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  <span>회의록 본문에 성공적으로 저장되었습니다!</span>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-border bg-muted/20">
              {step === "RECORDING" ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-xs"
                  >
                    닫기
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveToMeeting}
                      disabled={isSavePending || !transcript.trim()}
                      className="gap-1.5 text-xs"
                    >
                      <Save className="size-3.5" />
                      <span>{isSavePending ? "저장 중..." : "교정 없이 본문 저장"}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleStartClarification}
                      disabled={isAiPending || !transcript.trim()}
                      className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
                    >
                      <Sparkles className="size-3.5" />
                      <span>{isAiPending ? "AI 교정 분석 중..." : "AI 문맥 교정 및 검토"}</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("RECORDING")}
                    className="text-xs"
                  >
                    이전 (녹음 단계로)
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveToMeeting}
                      disabled={isSavePending}
                      className="gap-1.5 text-xs bg-primary text-primary-foreground font-bold"
                    >
                      <Save className="size-3.5" />
                      <span>{isSavePending ? "저장 중..." : "회의록에 최종 반영"}</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

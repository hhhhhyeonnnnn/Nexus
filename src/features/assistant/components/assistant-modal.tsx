"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistantAction } from "@/features/assistant/actions";
import type { AssistantChatMessage } from "@/lib/ai/assistant";

interface MessageItem {
  role: "user" | "assistant";
  text: string;
  keyPoints?: string[];
  suggestedActions?: Array<{ label: string; href: string }>;
}

const PRESET_PROMPTS = [
  "💰 현재 예산 잔액과 최근 지출 내역 알려줘",
  "📋 마감 임박 업무와 담당자가 누구야?",
  "📑 최근 회의 결정사항과 의결 내용 요약해줘",
  "⏳ 현재 승인 대기 중인 결재 문서는?",
];

export function AssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: "assistant",
      text: "안녕하세요! 학생회 전용 인수인계 및 운영 비서 **Nexus AI**입니다.\n\n예산 잔액, 업무 진행 현황, 회의록 의결 사항, 결재 대기 서류 등 궁금한 사항을 자유롭게 질문해 보세요.",
      suggestedActions: [
        { label: "대시보드", href: "/dashboard" },
        { label: "회계 장부", href: "/finance" },
        { label: "업무 관리", href: "/tasks" },
      ],
    },
  ]);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-assistant", handleOpen);
    return () => window.removeEventListener("open-assistant", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isPending) return;

    setInput("");
    const userMsg: MessageItem = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);

    const history: AssistantChatMessage[] = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    startTransition(async () => {
      const res = await askAssistantAction(query, history);
      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: res.data.answer,
            keyPoints: res.data.keyPoints,
            suggestedActions: res.data.suggestedActions,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `오류: ${res.error ?? "답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}`,
          },
        ]);
      }
    });
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        text: "대화 내용이 초기화되었습니다. 새로운 질문을 입력해 주세요!",
        suggestedActions: [
          { label: "대시보드", href: "/dashboard" },
          { label: "회계 장부", href: "/finance" },
        ],
      },
    ]);
  };

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in-0"
        >
          <div className="relative flex h-[85vh] max-h-[720px] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 id="assistant-modal-title" className="text-base font-bold text-foreground">
                    Nexus AI 학생회 어시스턴트
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    실시간 학생회 데이터 기반 지능형 인수인계 & 운영 비서
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                  title="대화 초기화"
                  aria-label="대화 초기화"
                >
                  <RotateCcw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                  aria-label="어시스턴트 닫기"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="flex gap-2 overflow-x-auto border-b border-border/60 bg-muted/20 px-4 py-2 text-xs no-scrollbar">
              {PRESET_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-sm ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4 text-primary" />}
                  </div>

                  <div
                    className={`max-w-[82%] space-y-2 rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "bg-muted/40 border border-border/70 text-foreground rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {m.text}
                    </div>

                    {/* Key points */}
                    {m.keyPoints && m.keyPoints.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                        {m.keyPoints.map((point, pIdx) => (
                          <span
                            key={pIdx}
                            className="inline-flex items-center rounded-md bg-background/80 px-2 py-0.5 text-xs text-muted-foreground border border-border/60"
                          >
                            ✓ {point}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested actions */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-wrap gap-2">
                        {m.suggestedActions.map((action, aIdx) => (
                          <Link
                            key={aIdx}
                            href={action.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex gap-3 text-sm">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                    <Bot className="size-4 text-primary animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-border/70 bg-muted/40 px-4 py-3 text-muted-foreground text-xs">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>학생회 운영 데이터를 분석하고 있습니다...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-border p-3 sm:p-4 bg-background/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="예: 이번 축제 예산 잔액이 얼마 남았지? 또는 마감 임박 업무는?"
                  className="flex-1 text-sm bg-card"
                  disabled={isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isPending}
                  className="shrink-0 size-9"
                  aria-label="질문 전송"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

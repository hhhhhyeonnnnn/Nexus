"use client";

import { useState } from "react";
import { X, ShieldCheck, FileText, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
  title?: string;
  type?: "APPLY" | "AUTH";
}

export function PrivacyConsentModal({
  isOpen,
  onClose,
  onAgree,
  title = "개인정보 수집 및 이용 동의",
  type = "APPLY",
}: PrivacyConsentModalProps) {
  const [activeTab, setActiveTab] = useState<"PRIVACY" | "TERMS">("PRIVACY");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[11px] text-muted-foreground">
                대한민국 개인정보보호법에 따른 필수 고지 사항
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b px-5 text-xs bg-card">
          <button
            type="button"
            onClick={() => setActiveTab("PRIVACY")}
            className={`py-2.5 px-2 font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              activeTab === "PRIVACY"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="size-3.5" />
            <span>개인정보 수집·이용 동의</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TERMS")}
            className={`py-2.5 px-2 font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              activeTab === "TERMS"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5" />
            <span>서비스 이용약관 요약</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-foreground/90 space-y-4 leading-relaxed">
          {activeTab === "PRIVACY" ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/60 border space-y-1">
                <span className="text-[11px] font-bold text-primary">개인정보보호법 제15조 제2항에 따른 고지</span>
                <p className="text-[11px] text-muted-foreground">
                  신청자께서는 본 동의를 거부하실 권리가 있습니다. 단, 필수 정보 미동의 시 행사 참가 신청 및 티켓 발권이 제한될 수 있습니다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">1. 수집하는 개인정보 항목</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {type === "APPLY" ? (
                    <>
                      <li><strong className="text-foreground">필수 항목:</strong> 성명(신청자명), 연락처(휴대폰 번호), 학번</li>
                      <li><strong className="text-foreground">선택 항목:</strong> 이메일 주소, 행사 설문 답변(부스명, 인원수 등)</li>
                    </>
                  ) : (
                    <>
                      <li><strong className="text-foreground">필수 항목:</strong> 이름, 이메일, 비밀번호, 소속 대학교</li>
                      <li><strong className="text-foreground">선택 항목:</strong> 부서명, 직책, 학번</li>
                    </>
                  )}
                  <li><strong className="text-foreground">자동 수집:</strong> 접속 IP, 서비스 이용 로그, 티켓 확인(Check-in) 일시</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">2. 수집 및 이용 목적</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>학생회 주최 행사 및 축제 부스 참가자 본인 확인 및 티켓(QR/바코드) 발급</li>
                  <li>행사 현장 게이트 입장 검표(Check-in) 및 중복 입장 방지</li>
                  <li>행사 일정 변경, 우천/비상 공지사항 SMS/알림 전달</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">3. 보유 및 이용 기간</h4>
                <p className="text-muted-foreground">
                  원칙적으로 수집 및 이용 목적이 달성된 후(행사 종료 및 정산 완료일로부터 30일 이내) 해당 정보를 지체 없이 파기합니다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">4. 동의 거부 권리 및 불이익 안내</h4>
                <p className="text-muted-foreground">
                  이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으나, 필수 동의 항목 미동의 시 행사 참가 신청 및 티켓 수령이 불가합니다.
                </p>
              </div>

              <div className="pt-2 text-right">
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
                >
                  개인정보 처리방침 전문 새 창 보기 &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">1. 서비스의 목적</h4>
                <p className="text-muted-foreground">
                  Nexus는 대학 학생 자치기구의 공공성과 자치 행정의 연속성을 위해 개발된 통합 운영 시스템입니다.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">2. 회원의 의무 및 티켓 양도 규정</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>타인의 명의나 연락처를 도용하여 허위 신청하는 행위를 엄격히 금지합니다.</li>
                  <li>발급된 티켓의 무단 전매 또는 영리 목적 재판매 행위 적발 시 사전 고지 없이 티켓이 취소될 수 있습니다.</li>
                  <li>학생회 주최 행사의 안전 관리 지침 및 현장 운영진의 통제를 준수해야 합니다.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">3. 면책 사항</h4>
                <p className="text-muted-foreground">
                  천재지변 또는 불가항력적 사유로 행사가 취소되거나 일정이 변동되는 경우 학생회 규정에 따라 공지 및 조치됩니다.
                </p>
              </div>

              <div className="pt-2 text-right">
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
                >
                  서비스 이용약관 전문 새 창 보기 &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-4 bg-muted/20">
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            약관 전문을 꼼꼼히 확인해 주세요.
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-xs"
            >
              닫기
            </Button>
            {onAgree && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onAgree();
                  onClose();
                }}
                className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold"
              >
                <CheckCircle2 className="size-3.5" />
                <span>내용 확인 및 동의</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

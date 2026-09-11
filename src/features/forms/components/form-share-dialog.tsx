"use client";

import { useState } from "react";
import { Share2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormShareDialog({
  formId,
  formTitle,
}: {
  formId: string;
  formTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  // Generate public url
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/apply/${formId}`
      : `/apply/${formId}`;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `[신청 접수] ${formTitle}`,
          text: `「${formTitle}」 온라인 신청이 진행 중입니다. 링크를 확인해 보세요!`,
          url: publicUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if share was canceled or aborted
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="gap-1.5 text-xs h-8"
        title={`${formTitle} 신청 링크 공유하기`}
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-600" />
            <span className="text-emerald-600 font-semibold">링크 복사됨!</span>
          </>
        ) : (
          <>
            <Share2 className="size-3.5 text-muted-foreground" />
            <span>신청 링크 공유</span>
          </>
        )}
      </Button>

      <a
        href={`/apply/${formId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center size-8 rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="공개 신청 페이지 미리보기 (새 탭)"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}

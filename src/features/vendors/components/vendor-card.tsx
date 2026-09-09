"use client";

import { useState, useTransition } from "react";
import { Star, Phone, User, Trash2, Check, Copy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteVendor, type VendorWithStats } from "@/features/vendors/actions";
import { EditVendorDialog } from "./edit-vendor-dialog";

interface VendorCardProps {
  vendor: VendorWithStats;
  isAdmin: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  "인쇄·홍보": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  "행사·축제": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
  "케이터링·푸드": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50",
  "굿즈·기념품": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  "제휴·후원": "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50",
  "기타": "bg-muted text-muted-foreground border-border",
};

export function VendorCard({ vendor, isAdmin }: VendorCardProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!vendor.phone) return;
    await navigator.clipboard.writeText(vendor.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!confirm(`'${vendor.name}' 업체를 삭제하시겠습니까?`)) {
      return;
    }
    startTransition(async () => {
      await deleteVendor(vendor.id);
    });
  };

  const catStyle =
    (vendor.category && CATEGORY_STYLES[vendor.category]) || CATEGORY_STYLES["기타"];

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4.5 shadow-2xs hover:border-border/80 hover:shadow-xs transition-all">
      <div>
        {/* Header: Name, Category, Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground truncate">{vendor.name}</h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${catStyle}`}
              >
                {vendor.category || "기타"}
              </span>
            </div>
            {/* Stars */}
            <div className="flex items-center gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  className={
                    star <= (vendor.rating ?? 5)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }
                />
              ))}
              <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                {vendor.rating ?? 5}.0
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <EditVendorDialog vendor={vendor} />
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="업체 삭제"
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground">
          {vendor.contact_name && (
            <div className="flex items-center gap-2">
              <User size={13} className="shrink-0 text-muted-foreground/70" />
              <span className="text-foreground/90">{vendor.contact_name}</span>
            </div>
          )}

          {vendor.phone ? (
            <div className="flex items-center gap-2">
              <Phone size={13} className="shrink-0 text-muted-foreground/70" />
              <a
                href={`tel:${vendor.phone}`}
                className="text-primary hover:underline font-medium"
              >
                {vendor.phone}
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="연락처 복사"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Phone size={13} className="shrink-0 opacity-50" />
              <span>연락처 미등록</span>
            </div>
          )}
        </div>

        {/* Memo box */}
        {vendor.memo && (
          <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border/50 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {vendor.memo}
          </div>
        )}
      </div>

      {/* Footer: Spending Stats */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Wallet size={13} className="text-muted-foreground/70" />
          <span>총 집행액</span>
        </div>
        <div className="text-right">
          <span className="font-semibold text-foreground">
            ₩{vendor.totalSpent.toLocaleString("ko-KR")}
          </span>
          {vendor.transactionCount > 0 && (
            <span className="ml-1 text-[11px] text-muted-foreground">
              ({vendor.transactionCount}건)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

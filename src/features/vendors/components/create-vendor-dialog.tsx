"use client";

import { useState, useTransition } from "react";
import { Plus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVendor } from "@/features/vendors/actions";

export const VENDOR_CATEGORIES = [
  "인쇄·홍보",
  "행사·축제",
  "케이터링·푸드",
  "굿즈·기념품",
  "제휴·후원",
  "기타",
];

export function CreateVendorDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("rating", String(rating));
    setError(null);

    startTransition(async () => {
      const res = await createVendor({ error: null }, formData);
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
        onClick={() => {
          setError(null);
          setRating(5);
          setIsOpen(true);
        }}
        className="gap-1.5 text-xs h-8.5 font-medium"
      >
        <Plus size={15} />
        <span>새 업체 등록</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">새 제휴·협력 업체 등록</h2>
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
                <Label htmlFor="vendor-name" className="text-xs font-semibold">
                  업체명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendor-name"
                  name="name"
                  placeholder="예: 청년인쇄, 신촌음향, 캠퍼스굿즈"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-category" className="text-xs font-semibold">
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <select
                  id="vendor-category"
                  name="category"
                  defaultValue="행사·축제"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-contact" className="text-xs font-semibold">
                    담당자명
                  </Label>
                  <Input
                    id="vendor-contact"
                    name="contact_name"
                    placeholder="예: 김실장"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-phone" className="text-xs font-semibold">
                    연락처
                  </Label>
                  <Input
                    id="vendor-phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">만족도 / 평점</Label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-muted-foreground transition-colors hover:text-amber-500"
                    >
                      <Star
                        size={18}
                        className={
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/40"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {rating}점 / 5점
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-memo" className="text-xs font-semibold">
                  메모 및 제휴 혜택
                </Label>
                <textarea
                  id="vendor-memo"
                  name="memo"
                  rows={3}
                  placeholder="예: 축제 현수막 20% 학생회 할인, 세금계산서 발행 가능, 배송 빠름"
                  className="w-full p-2 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {isPending ? "등록 중..." : "등록하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

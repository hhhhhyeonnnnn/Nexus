"use client";

import { useState, useTransition } from "react";
import { Edit2, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVendor, type VendorWithStats } from "@/features/vendors/actions";
import { VENDOR_CATEGORIES } from "./create-vendor-dialog";

interface EditVendorDialogProps {
  vendor: VendorWithStats;
}

export function EditVendorDialog({ vendor }: EditVendorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(vendor.rating ?? 5);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("vendor_id", vendor.id);
    formData.set("rating", String(rating));
    setError(null);

    startTransition(async () => {
      const res = await updateVendor({ error: null }, formData);
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
        variant="ghost"
        size="sm"
        onClick={() => {
          setError(null);
          setRating(vendor.rating ?? 5);
          setIsOpen(true);
        }}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="업체 정보 수정"
      >
        <Edit2 size={13} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">업체 정보 수정</h2>
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
                <Label htmlFor={`edit-vendor-name-${vendor.id}`} className="text-xs font-semibold">
                  업체명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edit-vendor-name-${vendor.id}`}
                  name="name"
                  defaultValue={vendor.name}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-vendor-cat-${vendor.id}`} className="text-xs font-semibold">
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <select
                  id={`edit-vendor-cat-${vendor.id}`}
                  name="category"
                  defaultValue={vendor.category ?? "기타"}
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
                  <Label htmlFor={`edit-contact-${vendor.id}`} className="text-xs font-semibold">
                    담당자명
                  </Label>
                  <Input
                    id={`edit-contact-${vendor.id}`}
                    name="contact_name"
                    defaultValue={vendor.contact_name ?? ""}
                    placeholder="예: 김실장"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-phone-${vendor.id}`} className="text-xs font-semibold">
                    연락처
                  </Label>
                  <Input
                    id={`edit-phone-${vendor.id}`}
                    name="phone"
                    defaultValue={vendor.phone ?? ""}
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
                <Label htmlFor={`edit-memo-${vendor.id}`} className="text-xs font-semibold">
                  메모 및 제휴 혜택
                </Label>
                <textarea
                  id={`edit-memo-${vendor.id}`}
                  name="memo"
                  rows={3}
                  defaultValue={vendor.memo ?? ""}
                  placeholder="예: 축제 현수막 20% 할인, 배송 빠름"
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

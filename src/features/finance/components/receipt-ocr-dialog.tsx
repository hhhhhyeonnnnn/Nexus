"use client";

import { useState, useTransition, useRef } from "react";
import {
  Sparkles,
  Upload,
  X,
  FileText,
  AlertCircle,
  Check,
  ZoomIn,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  analyzeReceiptWithAI,
  createLedgerEntry,
} from "@/features/finance/actions";
import { FINANCE_CATEGORIES } from "./create-entry-dialog";
import type { ReceiptOcrResult } from "@/lib/ai/receipt-ocr";
import { uploadReceiptImage } from "@/lib/supabase/storage";

interface ReceiptOcrDialogProps {
  vendors: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string; color: string }>;
}

export function ReceiptOcrDialog({
  vendors,
  projects,
  departments = [],
}: ReceiptOcrDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"UPLOAD" | "REVIEW">("UPLOAD");
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Image states
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [imageFileName, setImageFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI OCR Result & Form states
  const [ocrResult, setOcrResult] = useState<ReceiptOcrResult | null>(null);
  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [category, setCategory] = useState("비품·운영비");
  const [vendorId, setVendorId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [isZoomed, setIsZoomed] = useState(false);

  const resetAll = () => {
    setStep("UPLOAD");
    setError(null);
    setImageBase64(null);
    setImageFileName("");
    setOcrResult(null);
    setTitle("");
    setAmountStr("");
    setTransactionDate("");
    setCategory("비품·운영비");
    setVendorId("");
    setDepartmentId("");
    setProjectId("");
    setIsZoomed(false);
  };

  // Resize and convert file to compressed JPEG base64 (Max 1200px width/height, quality 0.8)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일(JPG, PNG, WEBP)만 업로드할 수 있습니다.");
      return;
    }

    setImageFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setImageBase64(compressedDataUrl);
          setImageMime("image/jpeg");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Run AI analysis
  const handleAnalyze = () => {
    if (!imageBase64) return;
    setError(null);

    startTransition(async () => {
      const res = await analyzeReceiptWithAI(imageBase64, imageMime);
      if (!res.success || !res.data) {
        setError(res.error || "영수증을 분석하지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      const data = res.data;
      setOcrResult(data);
      setTitle(data.summaryTitle);
      setAmountStr(String(data.totalAmount));
      setTransactionDate(data.transactionDate);
      setCategory(
        FINANCE_CATEGORIES.includes(data.suggestedCategory)
          ? data.suggestedCategory
          : "비품·운영비",
      );
      setVendorId(data.suggestedVendorId || "");
      setDepartmentId(data.suggestedDepartmentId || "");
      setProjectId(data.suggestedProjectId || "");
      setStep("REVIEW");
    });
  };

  // Submit to Ledger
  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startSubmitTransition(async () => {
      let finalReceiptUrl: string | null = null;
      if (imageBase64) {
        const uploadRes = await uploadReceiptImage(imageBase64);
        finalReceiptUrl = uploadRes.url || imageBase64;
      }

      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("type", "EXPENSE");
      formData.set("amount", amountStr);
      formData.set("planned_amount", amountStr);
      formData.set("category", category);
      formData.set("transaction_date", transactionDate);
      if (vendorId) formData.set("vendor_id", vendorId);
      if (projectId) formData.set("project_id", projectId);
      if (departmentId) formData.set("department_id", departmentId);
      if (finalReceiptUrl) formData.set("receipt_url", finalReceiptUrl);

      const res = await createLedgerEntry({ error: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        resetAll();
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          resetAll();
          setIsOpen(true);
        }}
        className="gap-1.5 text-xs font-semibold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-xs hover:opacity-95 transition-all"
      >
        <Sparkles className="size-3.5 text-amber-300" />
        <span>영수증 AI 자동 입력</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in-0">
          <div
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    영수증 OCR 및 지출 결의서 자동 입력
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    영수증 사진을 올리면 상호명, 결제일자, 금액, 세부 품목을 AI가 즉시 판독합니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Uploading */}
              {step === "UPLOAD" && (
                <div className="space-y-6 max-w-xl mx-auto py-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      imageBase64
                        ? "border-primary/50 bg-primary/5"
                        : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {imageBase64 ? (
                      <div className="space-y-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageBase64}
                          alt="영수증 미리보기"
                          className="max-h-64 mx-auto rounded-lg shadow-md object-contain border bg-background"
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                            <Check className="size-3.5 text-emerald-600" />
                            {imageFileName || "영수증 이미지 선택 완료"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            클릭하거나 다른 이미지를 드래그하여 교체할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Upload className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            영수증 이미지를 드래그하거나 클릭하여 선택하세요
                          </p>
                          <p className="text-xs text-muted-foreground">
                            종이 영수증 사진, 카드 결제 전표, 모바일 전자영수증 캡처 (JPG, PNG, WEBP)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      disabled={!imageBase64 || isPending}
                      onClick={handleAnalyze}
                      className="text-xs font-semibold gap-2 h-9 px-5"
                    >
                      {isPending ? (
                        <>
                          <span className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Vision AI로 영수증 판독 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          <span>AI로 영수증 분석하기</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Split Review & Expense Form */}
              {step === "REVIEW" && ocrResult && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Receipt Image Viewer (5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>원본 영수증 증빙</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsZoomed(!isZoomed)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="확대/축소"
                        >
                          <ZoomIn className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep("UPLOAD")}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
                          title="다른 영수증 다시 올리기"
                        >
                          <RotateCcw className="size-3.5" />
                          재업로드
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/10 p-2 overflow-hidden flex items-center justify-center min-h-[320px] max-h-[500px]">
                      {imageBase64 && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imageBase64}
                          alt="영수증 원본"
                          className={`rounded-lg object-contain transition-all duration-200 ${
                            isZoomed ? "scale-150 cursor-zoom-out" : "max-h-[480px] cursor-zoom-in"
                          }`}
                          onClick={() => setIsZoomed(!isZoomed)}
                        />
                      )}
                    </div>

                    {ocrResult.confidenceNote && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1">
                        <span className="font-semibold text-primary block flex items-center gap-1">
                          <Sparkles className="size-3" />
                          AI 판독 참고사항
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {ocrResult.confidenceNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Auto-populated Form (7 cols) */}
                  <form onSubmit={handleRegisterExpense} className="lg:col-span-7 space-y-4">
                    {/* Top Summary Banner */}
                    <div className="p-3 rounded-xl bg-card border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">인식된 가맹점</span>
                        <span className="font-bold text-foreground text-sm">
                          {ocrResult.storeName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[11px]">인식 결제금액</span>
                        <span className="font-mono font-bold text-rose-600 text-sm">
                          ₩{Number(ocrResult.totalAmount).toLocaleString("ko-KR")}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="ocr-title" className="text-xs font-semibold">
                        지출 결의서 항목명 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ocr-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="text-sm font-medium"
                      />
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ocr-amount" className="text-xs font-semibold">
                          결제 금액 (원) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="ocr-amount"
                          type="number"
                          min="0"
                          value={amountStr}
                          onChange={(e) => setAmountStr(e.target.value)}
                          required
                          className="font-mono text-sm font-bold text-rose-600"
                        />
                        {amountStr && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ₩{Number(amountStr).toLocaleString("ko-KR")}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ocr-date" className="text-xs font-semibold">
                          결제 일자 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="ocr-date"
                          type="date"
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                          required
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Category & Department */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ocr-category" className="text-xs font-semibold">
                          지출 카테고리
                        </Label>
                        <select
                          id="ocr-category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                        >
                          {FINANCE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ocr-dept" className="text-xs font-semibold">
                          담당 부서 (추천)
                        </Label>
                        <select
                          id="ocr-dept"
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                        >
                          <option value="">부서 미지정</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Vendor & Project */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ocr-vendor" className="text-xs font-semibold">
                          거래처 매칭
                        </Label>
                        <select
                          id="ocr-vendor"
                          value={vendorId}
                          onChange={(e) => setVendorId(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                        >
                          <option value="">거래처 없음 / 직접 결제</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ocr-project" className="text-xs font-semibold">
                          연관 프로젝트
                        </Label>
                        <select
                          id="ocr-project"
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                        >
                          <option value="">연관 프로젝트 없음</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Itemized Breakdown Table if items exist */}
                    {ocrResult.items && ocrResult.items.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <FileText className="size-3.5 text-muted-foreground" />
                          구매 세부 품목 ({ocrResult.items.length}개)
                        </span>
                        <div className="rounded-lg border bg-muted/20 overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-muted/40 border-b text-muted-foreground">
                              <tr>
                                <th className="py-1.5 px-3">품목명</th>
                                <th className="py-1.5 px-2 text-center">수량</th>
                                <th className="py-1.5 px-2 text-right">단가</th>
                                <th className="py-1.5 px-3 text-right">금액</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {ocrResult.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-muted/20">
                                  <td className="py-1.5 px-3 font-medium text-foreground">
                                    {item.name}
                                  </td>
                                  <td className="py-1.5 px-2 text-center text-muted-foreground">
                                    {item.quantity}
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                                    ₩{item.unitPrice.toLocaleString("ko-KR")}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono font-semibold">
                                    ₩{item.totalPrice.toLocaleString("ko-KR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Modal Footer Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep("UPLOAD")}
                        disabled={isSubmitting}
                      >
                        이전
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsOpen(false)}
                          disabled={isSubmitting}
                        >
                          취소
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>장부 등록 중...</span>
                            </>
                          ) : (
                            <>
                              <Check className="size-4" />
                              <span>장부에 지출 등록하기</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

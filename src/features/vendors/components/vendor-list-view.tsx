"use client";

import { useState, useMemo } from "react";
import { Search, Building2, Wallet, Star, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { VendorWithStats } from "@/features/vendors/actions";
import { CreateVendorDialog, VENDOR_CATEGORIES } from "./create-vendor-dialog";
import { VendorCard } from "./vendor-card";

interface VendorListViewProps {
  initialVendors: VendorWithStats[];
  categoryCounts: Record<string, number>;
  isAdmin: boolean;
}

export function VendorListView({
  initialVendors,
  categoryCounts,
  isAdmin,
}: VendorListViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["ALL", ...VENDOR_CATEGORIES];

  const filteredVendors = useMemo(() => {
    return initialVendors.filter((vendor) => {
      const matchCategory =
        selectedCategory === "ALL" || (vendor.category || "기타") === selectedCategory;

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchName = vendor.name.toLowerCase().includes(q);
      const matchContact = (vendor.contact_name || "").toLowerCase().includes(q);
      const matchMemo = (vendor.memo || "").toLowerCase().includes(q);
      const matchPhone = (vendor.phone || "").toLowerCase().includes(q);

      return matchName || matchContact || matchMemo || matchPhone;
    });
  }, [initialVendors, selectedCategory, searchQuery]);

  // Summary statistics
  const totalCount = initialVendors.length;
  const totalSpentAll = initialVendors.reduce((acc, v) => acc + v.totalSpent, 0);
  const activeVendors = initialVendors.filter((v) => v.transactionCount > 0).length;
  const avgRating =
    totalCount > 0
      ? (
          initialVendors.reduce((acc, v) => acc + (v.rating ?? 5), 0) / totalCount
        ).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="text-primary" size={22} />
            <span>제휴·협력 업체 관리</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            축제 무대, 렌탈, 인쇄, 케이터링, 굿즈 등 학생회 공식 협력 업체와 거래 이력을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreateVendorDialog />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">총 등록 업체</span>
            <Building2 size={16} className="text-primary/70" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground">{totalCount}개</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">누적 거래 집행액</span>
            <Wallet size={16} className="text-emerald-500/70" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground">
            ₩{totalSpentAll.toLocaleString("ko-KR")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">거래 발생 업체</span>
            <FileText size={16} className="text-blue-500/70" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground">{activeVendors}개소</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">평균 만족도</span>
            <Star size={16} className="text-amber-500/70" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground flex items-baseline gap-1">
            <span>{avgRating}</span>
            <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="업체명, 담당자, 연락처, 메모 검색..."
            className="pl-9 h-8.5 text-xs bg-background"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "ALL" ? initialVendors.length : (categoryCounts[cat] ?? 0);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{cat === "ALL" ? "전체" : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground border border-border/40"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Building2 className="mx-auto text-muted-foreground/50 mb-3" size={32} />
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery || selectedCategory !== "ALL"
              ? "조건에 일치하는 협력 업체가 없습니다."
              : "등록된 제휴·협력 업체가 없습니다."}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || selectedCategory !== "ALL"
              ? "검색어 또는 카테고리 필터를 변경해 보세요."
              : "새 협력 업체를 등록하여 제휴 혜택과 연락처, 거래 내역을 기록해 보세요."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

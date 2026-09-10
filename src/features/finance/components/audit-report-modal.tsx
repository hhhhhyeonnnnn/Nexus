"use client";

import { useState } from "react";
import {
  FileText,
  Printer,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancePageData } from "../actions";

interface AuditReportModalProps {
  data: FinancePageData;
}

export function AuditReportModal({ data }: AuditReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState<string>("ALL");

  const { entries } = data;

  // Filter entries based on period
  const filteredEntries = entries.filter((e) => {
    if (period === "ALL") return true;
    const year = e.transaction_date.substring(0, 4);
    const month = parseInt(e.transaction_date.substring(5, 7), 10);

    if (period === "2026_1") {
      return year === "2026" && month >= 3 && month <= 6;
    }
    if (period === "2026_SUMMER") {
      return year === "2026" && month >= 7 && month <= 8;
    }
    if (period === "2026_2") {
      return year === "2026" && month >= 9 && month <= 12;
    }
    return true;
  });

  // Calculate aggregates
  let totalIncome = 0;
  let totalExpense = 0;
  let plannedTotal = 0;
  let receiptAttachedCount = 0;
  let totalExpenseCount = 0;

  filteredEntries.forEach((e) => {
    plannedTotal += e.planned_amount || 0;
    if (e.type === "INCOME") {
      totalIncome += e.actual_amount;
    } else {
      totalExpense += e.actual_amount;
      totalExpenseCount += 1;
      if (e.receipt_url) {
        receiptAttachedCount += 1;
      }
    }
  });

  const balance = totalIncome - totalExpense;
  const executionRate =
    plannedTotal > 0
      ? ((totalExpense / plannedTotal) * 100).toFixed(1)
      : totalExpense > 0
      ? "100.0"
      : "0.0";
  const receiptRate =
    totalExpenseCount > 0
      ? ((receiptAttachedCount / totalExpenseCount) * 100).toFixed(1)
      : "100.0";

  // Breakdown by Department
  const departmentBreakdown: Record<string, number> = {};
  filteredEntries
    .filter((e) => e.type === "EXPENSE")
    .forEach((e) => {
      const dName = e.departmentName || "부서 미지정";
      departmentBreakdown[dName] = (departmentBreakdown[dName] || 0) + e.actual_amount;
    });

  // Breakdown by Project
  const projectBreakdown: Record<string, { planned: number; actual: number }> = {};
  filteredEntries.forEach((e) => {
    const pName = e.projectName || "일반 운영 경비";
    if (!projectBreakdown[pName]) {
      projectBreakdown[pName] = { planned: 0, actual: 0 };
    }
    projectBreakdown[pName].planned += e.planned_amount || 0;
    if (e.type === "EXPENSE") {
      projectBreakdown[pName].actual += e.actual_amount;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = [
      "일자",
      "구분",
      "적요(항목명)",
      "카테고리",
      "담당부서",
      "연계프로젝트",
      "거래처",
      "계획예산(원)",
      "실제집행금액(원)",
      "증빙영수증유무",
    ];

    const rows = filteredEntries.map((e) => [
      `"${e.transaction_date}"`,
      `"${e.type === "INCOME" ? "수입" : "지출"}"`,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${(e.category || "").replace(/"/g, '""')}"`,
      `"${(e.departmentName || "미지정").replace(/"/g, '""')}"`,
      `"${(e.projectName || "일반").replace(/"/g, '""')}"`,
      `"${(e.vendorName || "-").replace(/"/g, '""')}"`,
      e.planned_amount || 0,
      e.actual_amount || 0,
      e.receipt_url ? "유 (첨부완료)" : "무",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `학생회_회계결산_감사원장_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs font-medium"
      >
        <FileText size={15} className="text-primary" />
        감사 결산 보고서
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          {/* Modal Container */}
          <div className="w-full max-w-4xl rounded-2xl border bg-background shadow-2xl overflow-hidden my-auto">
            {/* Top Toolbar (Non-printable) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-6 py-3.5 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-primary size-5" />
                <span className="font-bold text-sm text-foreground">
                  학생회 회계 결산 및 총회 감사 보고서
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="rounded-md border bg-background px-2.5 py-1 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">전체 회계 기간</option>
                  <option value="2026_1">2026학년도 1학기 (3~6월)</option>
                  <option value="2026_SUMMER">2026학년도 여름방학 (7~8월)</option>
                  <option value="2026_2">2026학년도 2학기 (9~12월)</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCsv}
                  className="gap-1.5 text-xs h-8"
                >
                  <Download size={13} />
                  엑셀(CSV) 다운로드
                </Button>

                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground"
                >
                  <Printer size={13} />
                  인쇄 / PDF 저장
                </Button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-sm p-1 ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Printable Area */}
            <div
              id="audit-document"
              className="p-8 sm:p-12 space-y-8 bg-white text-black print:p-0 print:m-0 print:text-black max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {/* Official Header */}
              <div className="text-center border-b-2 border-black pb-6 space-y-2">
                <span className="text-xs uppercase tracking-widest text-neutral-600">
                  Official Audit & Settlement Statement
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                  학생회비 및 사업비 집행 결산 감사 보고서
                </h1>
                <p className="text-xs text-neutral-700">
                  회계기간:{" "}
                  <strong>
                    {period === "ALL"
                      ? "2026학년도 전체 회계 기간"
                      : period === "2026_1"
                      ? "2026학년도 제1학기 (2026.03.01 ~ 2026.06.30)"
                      : period === "2026_SUMMER"
                      ? "2026학년도 하계방학 (2026.07.01 ~ 2026.08.31)"
                      : "2026학년도 제2학기 (2026.09.01 ~ 2026.12.31)"}
                  </strong>{" "}
                  | 작성일: {new Date().toLocaleDateString("ko-KR")}
                </p>
              </div>

              {/* 1. Executive Summary Table */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5 border-l-4 border-black pl-2">
                  1. 총괄 수입·지출 결산 요약
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="border border-neutral-300 p-2.5 bg-neutral-50">
                    <span className="text-[11px] text-neutral-600 block">총 예산액</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-0.5">
                      ₩{plannedTotal.toLocaleString("ko-KR")}
                    </strong>
                  </div>
                  <div className="border border-neutral-300 p-2.5 bg-neutral-50">
                    <span className="text-[11px] text-neutral-600 block">총 수입액</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-0.5 text-blue-700">
                      ₩{totalIncome.toLocaleString("ko-KR")}
                    </strong>
                  </div>
                  <div className="border border-neutral-300 p-2.5 bg-neutral-50">
                    <span className="text-[11px] text-neutral-600 block">총 지출액</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-0.5 text-red-700">
                      ₩{totalExpense.toLocaleString("ko-KR")}
                    </strong>
                  </div>
                  <div className="border border-neutral-300 p-2.5 bg-neutral-50">
                    <span className="text-[11px] text-neutral-600 block">차기 이월 잔액</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-0.5 text-emerald-800">
                      ₩{balance.toLocaleString("ko-KR")}
                    </strong>
                  </div>
                  <div className="border border-neutral-300 p-2.5 bg-neutral-50 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-neutral-600 block">예산 집행률</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-0.5">
                      {executionRate}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. Breakdown Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Department Breakdown */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-neutral-900 border-l-3 border-neutral-700 pl-2">
                    2. 부서별 지출 결산 내역
                  </h3>
                  <table className="w-full text-left text-xs border border-neutral-300">
                    <thead className="bg-neutral-100 border-b border-neutral-300">
                      <tr>
                        <th className="p-2">부서명</th>
                        <th className="p-2 text-right">집행 금액</th>
                        <th className="p-2 text-right">비중</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {Object.keys(departmentBreakdown).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-neutral-500">
                            지출 내역 없음
                          </td>
                        </tr>
                      ) : (
                        Object.entries(departmentBreakdown).map(([dept, amt]) => (
                          <tr key={dept}>
                            <td className="p-2 font-medium">{dept}</td>
                            <td className="p-2 text-right">₩{amt.toLocaleString("ko-KR")}</td>
                            <td className="p-2 text-right text-neutral-600">
                              {totalExpense > 0
                                ? ((amt / totalExpense) * 100).toFixed(1)
                                : "0.0"}
                              %
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Project Breakdown */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-neutral-900 border-l-3 border-neutral-700 pl-2">
                    3. 주요 프로젝트별 결산 내역
                  </h3>
                  <table className="w-full text-left text-xs border border-neutral-300">
                    <thead className="bg-neutral-100 border-b border-neutral-300">
                      <tr>
                        <th className="p-2">프로젝트명</th>
                        <th className="p-2 text-right">예산</th>
                        <th className="p-2 text-right">실지출</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {Object.keys(projectBreakdown).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-neutral-500">
                            프로젝트 내역 없음
                          </td>
                        </tr>
                      ) : (
                        Object.entries(projectBreakdown).map(([proj, val]) => (
                          <tr key={proj}>
                            <td className="p-2 font-medium">{proj}</td>
                            <td className="p-2 text-right text-neutral-600">
                              ₩{val.planned.toLocaleString("ko-KR")}
                            </td>
                            <td className="p-2 text-right font-semibold">
                              ₩{val.actual.toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Receipt Verification Audit */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-900 border-l-3 border-neutral-700 pl-2">
                  4. 회계 증빙(영수증 첨부) 검증 현황
                </h3>
                <div className="rounded-lg border border-neutral-300 p-3.5 bg-neutral-50 text-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-neutral-900">
                      총 지출 {totalExpenseCount}건 중 {receiptAttachedCount}건 적격 영수증 첨부 완료
                    </p>
                    <p className="text-[11px] text-neutral-600">
                      미첨부 건수: {totalExpenseCount - receiptAttachedCount}건 (카드 전표 또는 전자 세금계산서 증빙 권고)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-500 block">영수증 증빙율</span>
                    <strong className="text-base font-bold text-emerald-800">
                      {receiptRate}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* 5. Detailed Ledger Entries Table (Print Sample / Summary) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-900 border-l-3 border-neutral-700 pl-2">
                  5. 지출 및 수입 세부 내역 (최근 15건)
                </h3>
                <table className="w-full text-left text-[11px] border border-neutral-300">
                  <thead className="bg-neutral-100 border-b border-neutral-300 font-semibold">
                    <tr>
                      <th className="p-1.5">일자</th>
                      <th className="p-1.5">구분</th>
                      <th className="p-1.5">적요</th>
                      <th className="p-1.5">부서</th>
                      <th className="p-1.5 text-right">금액</th>
                      <th className="p-1.5 text-center">증빙</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredEntries.slice(0, 15).map((e) => (
                      <tr key={e.id}>
                        <td className="p-1.5 text-neutral-600">{e.transaction_date}</td>
                        <td className="p-1.5">
                          <span
                            className={`font-semibold ${
                              e.type === "INCOME" ? "text-blue-700" : "text-red-700"
                            }`}
                          >
                            {e.type === "INCOME" ? "수입" : "지출"}
                          </span>
                        </td>
                        <td className="p-1.5 font-medium">{e.title}</td>
                        <td className="p-1.5 text-neutral-600">{e.departmentName || "-"}</td>
                        <td className="p-1.5 text-right font-mono">
                          ₩{e.actual_amount.toLocaleString("ko-KR")}
                        </td>
                        <td className="p-1.5 text-center">
                          {e.receipt_url ? "✓ 첨부" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 6. Signatures and Stamps Block (공식 감사 직인 서명란) */}
              <div className="pt-6 border-t-2 border-black space-y-6">
                <p className="text-center text-xs text-neutral-800 leading-relaxed">
                  본 보고서는 Nexus 학생회 통합 운영 시스템을 통해 작성되었으며, <br />
                  학생회비 및 사업비 집행 원장의 모든 내역과 증빙 자료가 사실과 일치함을 확인하고 서명 날인합니다.
                </p>

                <div className="grid grid-cols-3 gap-4 text-center text-xs pt-2">
                  <div className="border border-neutral-300 p-3 space-y-4">
                    <span className="text-[11px] text-neutral-600 block">회계 담당 / 재정국장</span>
                    <div className="h-10 flex items-center justify-center text-neutral-400 border-b border-dashed">
                      (서명 또는 인)
                    </div>
                  </div>

                  <div className="border border-neutral-300 p-3 space-y-4">
                    <span className="text-[11px] text-neutral-600 block">총학생회장 / 집행위원장</span>
                    <div className="h-10 flex items-center justify-center text-neutral-400 border-b border-dashed">
                      (서명 또는 직인)
                    </div>
                  </div>

                  <div className="border border-neutral-300 p-3 space-y-4">
                    <span className="text-[11px] text-neutral-600 block">중앙감사위원회 감사위원장</span>
                    <div className="h-10 flex items-center justify-center text-neutral-400 border-b border-dashed">
                      (감사인 날인)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

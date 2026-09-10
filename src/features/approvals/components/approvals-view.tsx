"use client";

import { useState } from "react";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import { CreateApprovalDialog } from "./create-approval-dialog";
import { ApprovalDetailModal } from "./approval-detail-modal";
import {
  type ApprovalStepItem,
  type ApprovalWithRelations,
} from "../actions";

interface ApprovalsViewProps {
  approvals: ApprovalWithRelations[];
  currentUserId: string;
  departments: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}

const TYPE_MAP: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  EXPENSE: { label: "지출결의", tone: "warning" },
  EVENT: { label: "행사기획", tone: "accent" },
  GENERAL: { label: "일반품의", tone: "neutral" },
};

export function ApprovalsView({
  approvals,
  currentUserId,
  departments,
  projects,
}: ApprovalsViewProps) {
  const [tab, setTab] = useState<"ALL" | "PENDING" | "MY_SUBMISSIONS" | "APPROVED" | "REJECTED">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalWithRelations | null>(null);

  // Top KPIs
  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;
  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = approvals.filter((a) => a.status === "REJECTED").length;
  const mySubmissionsCount = approvals.filter((a) => a.applicant_id === currentUserId).length;

  const filteredApprovals = approvals.filter((a) => {
    if (tab === "PENDING" && a.status !== "PENDING") return false;
    if (tab === "APPROVED" && a.status !== "APPROVED") return false;
    if (tab === "REJECTED" && a.status !== "REJECTED") return false;
    if (tab === "MY_SUBMISSIONS" && a.applicant_id !== currentUserId) return false;
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              전자결재 시스템
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Approval Workflow
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            예산 지출 결의서, 행사 기획안, 일반 품의서를 부서장 및 회장단 다단계 결재선으로 심사합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateApprovalDialog departments={departments} projects={projects} />
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock size={15} className="text-amber-500" />
            <span>결재 대기 문서</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">
            {pendingCount}건
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            심사 및 결재 필요
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>최종 승인 완료</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {approvedCount}건
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            장부 연계 및 집행 확정
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <FileCheck2 size={15} className="text-primary" />
            <span>내가 올린 기안</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5">
            {mySubmissionsCount}건
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            본인 기안 상신 내역
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <XCircle size={15} className="text-destructive" />
            <span>반려 문서</span>
          </div>
          <p className="text-2xl font-bold text-destructive mt-1.5">
            {rejectedCount}건
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            재기안 및 보완 필요
          </p>
        </div>
      </div>

      {/* 3. Filters & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "ALL", label: `전체 문서 (${approvals.length})` },
            { key: "PENDING", label: `결재 대기 (${pendingCount})` },
            { key: "MY_SUBMISSIONS", label: `내 기안함 (${mySubmissionsCount})` },
            { key: "APPROVED", label: `승인 보관함 (${approvedCount})` },
            { key: "REJECTED", label: `반려함 (${rejectedCount})` },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as typeof tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === item.key
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">유형:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">전체 유형</option>
            <option value="EXPENSE">💰 지출 결의서</option>
            <option value="EVENT">🎪 행사·기획안</option>
            <option value="GENERAL">📝 일반 품의서</option>
          </select>
        </div>
      </div>

      {/* 4. Table */}
      {filteredApprovals.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <FileCheck2 className="mx-auto mb-3 text-muted-foreground/50" size={32} />
          <p className="font-medium text-sm">해당 조건의 결재 문서가 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b text-muted-foreground font-medium">
                <tr>
                  <th className="p-3.5">문서 구분</th>
                  <th className="p-3.5">기안 제목</th>
                  <th className="p-3.5">기안자 / 부서</th>
                  <th className="p-3.5">요청 금액</th>
                  <th className="p-3.5">결재선 상태</th>
                  <th className="p-3.5">상태</th>
                  <th className="p-3.5">기안일자</th>
                  <th className="p-3.5 text-right">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredApprovals.map((item) => {
                  const typeInfo = TYPE_MAP[item.type] || { label: item.type, tone: "neutral" as const };
                  const steps = (item.steps as unknown as ApprovalStepItem[]) || [];

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5">
                        <StatusChip tone={typeInfo.tone}>{typeInfo.label}</StatusChip>
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">
                        <span
                          className="cursor-pointer hover:underline hover:text-primary"
                          onClick={() => setSelectedApproval(item)}
                        >
                          {item.title}
                        </span>
                        {item.projects && (
                          <span className="block text-[11px] text-muted-foreground font-normal">
                            프로젝트: {item.projects.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        <strong className="text-foreground">{item.profiles?.name || "기안자"}</strong>
                        {item.departments && (
                          <span className="block text-[11px] text-muted-foreground">
                            {item.departments.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-medium text-foreground">
                        {item.amount ? `${Number(item.amount).toLocaleString()}원` : "-"}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">
                            {item.current_step}/{item.total_steps}단계
                          </span>
                          <span className="text-[11px] text-muted-foreground/60">•</span>
                          <span className="text-[11px] font-medium text-primary">
                            {item.status === "APPROVED"
                              ? "전결 완료"
                              : item.status === "REJECTED"
                              ? "반려"
                              : steps[item.current_step - 1]?.name || "검토 중"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <StatusChip
                          tone={
                            item.status === "APPROVED"
                              ? "success"
                              : item.status === "REJECTED"
                              ? "destructive"
                              : "accent"
                          }
                        >
                          {item.status === "APPROVED"
                            ? "승인"
                            : item.status === "REJECTED"
                            ? "반려"
                            : "결재 대기"}
                        </StatusChip>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApproval(item)}
                          className="h-7 px-2.5 text-xs"
                        >
                          <Eye size={13} className="mr-1" />
                          조회
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Detail Modal */}
      {selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </div>
  );
}

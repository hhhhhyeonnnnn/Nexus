import Link from "next/link";
import {
  Ticket,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { getEventForms } from "@/features/forms/actions";
import { getProjects } from "@/features/projects/actions";
import { CreateFormDialog } from "@/features/forms/components/create-form-dialog";
import { FormShareDialog } from "@/features/forms/components/form-share-dialog";

export const dynamic = "force-dynamic";

export default async function FormsPage(props: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = (searchParams.status as "ALL" | "OPEN" | "CLOSED" | "DRAFT") || "ALL";
  const categoryFilter = searchParams.category || "ALL";

  const [forms, projects] = await Promise.all([
    getEventForms(statusFilter, categoryFilter),
    getProjects("ALL"),
  ]);

  const availableProjects = projects.map((p) => ({ id: p.id, name: p.name }));

  // Aggregate stats
  const totalForms = forms.length;
  const openForms = forms.filter((f) => f.status === "OPEN").length;
  const totalSubmissions = forms.reduce((acc, f) => acc + f.totalSubmissions, 0);
  const totalApproved = forms.reduce((acc, f) => acc + f.approvedCount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              행사·부스 신청 관리
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {forms.length}개
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            축제 부스 신청, 행사 티켓 예매, 참가자 접수 폼을 개설하고 실시간으로 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateFormDialog projects={availableProjects} />
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">전체 신청 폼</span>
            <Ticket className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalForms}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">현재 모집 중</span>
            <Clock className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{openForms}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">총 접수 신청</span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSubmissions}건</p>
        </div>

        <div className="p-4 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">승인 완료</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalApproved}건</p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-lg border">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/forms?status=ALL"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === "ALL"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            전체 폼
          </Link>
          <Link
            href="/forms?status=OPEN"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === "OPEN"
                ? "bg-emerald-600 text-white font-semibold"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            🟢 모집 중
          </Link>
          <Link
            href="/forms?status=DRAFT"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === "DRAFT"
                ? "bg-amber-500 text-white font-semibold"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            🟡 작성 중
          </Link>
          <Link
            href="/forms?status=CLOSED"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === "CLOSED"
                ? "bg-destructive text-destructive-foreground font-semibold"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            🔴 마감
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>유형:</span>
          <Link
            href={`/forms?status=${statusFilter}&category=ALL`}
            className={`px-2 py-1 rounded transition-colors ${
              categoryFilter === "ALL" ? "font-bold text-primary underline" : "hover:text-foreground"
            }`}
          >
            전체
          </Link>
          <span>·</span>
          <Link
            href={`/forms?status=${statusFilter}&category=BOOTH`}
            className={`px-2 py-1 rounded transition-colors ${
              categoryFilter === "BOOTH" ? "font-bold text-primary underline" : "hover:text-foreground"
            }`}
          >
            부스 신청
          </Link>
          <span>·</span>
          <Link
            href={`/forms?status=${statusFilter}&category=TICKET`}
            className={`px-2 py-1 rounded transition-colors ${
              categoryFilter === "TICKET" ? "font-bold text-primary underline" : "hover:text-foreground"
            }`}
          >
            티켓 예매
          </Link>
          <span>·</span>
          <Link
            href={`/forms?status=${statusFilter}&category=GENERAL`}
            className={`px-2 py-1 rounded transition-colors ${
              categoryFilter === "GENERAL" ? "font-bold text-primary underline" : "hover:text-foreground"
            }`}
          >
            일반 접수
          </Link>
        </div>
      </div>

      {/* 4. Form Cards Grid */}
      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Ticket className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">개설된 신청 폼이 없습니다</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              축제 부스 신청, 동아리 박람회, 티켓 예매 등 학생들을 위한 첫 번째 신청 폼을 만들어 보세요.
            </p>
          </div>
          <div>
            <CreateFormDialog projects={availableProjects} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => {
            const isFull =
              form.max_capacity !== null && form.approvedCount >= form.max_capacity;

            return (
              <div
                key={form.id}
                className="flex flex-col justify-between rounded-xl border bg-card p-5 hover:border-primary/40 transition-all shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {form.category === "BOOTH" && "🎪 부스/주점 신청"}
                        {form.category === "TICKET" && "🎫 티켓/입장권"}
                        {form.category === "GENERAL" && "📋 일반 참가 신청"}
                      </span>

                      {form.projects && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {form.projects.name}
                        </span>
                      )}
                    </div>

                    <div>
                      {form.status === "OPEN" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          모집 중
                        </span>
                      )}
                      {form.status === "DRAFT" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          작성 중 (비공개)
                        </span>
                      )}
                      {form.status === "CLOSED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                          마감됨
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                      <Link href={`/forms/${form.id}`}>{form.title}</Link>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {form.description || "등록된 설명이 없습니다."}
                    </p>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-lg text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">총 접수</span>
                      <span className="font-semibold text-foreground">{form.totalSubmissions}건</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">승인 완료</span>
                      <span className="font-semibold text-emerald-600">{form.approvedCount}건</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">현장 입장</span>
                      <span className="font-semibold text-primary">{form.checkedInCount}명</span>
                    </div>
                  </div>

                  {/* Dates & Capacity */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>
                        {form.end_at
                          ? `${new Date(form.end_at).toLocaleDateString("ko-KR")} 마감`
                          : "상시 모집"}
                      </span>
                    </div>

                    <div>
                      정원:{" "}
                      <span className="font-medium text-foreground">
                        {form.max_capacity ? `${form.max_capacity}명` : "무제한"}
                      </span>
                      {isFull && <span className="ml-1 text-destructive font-semibold">(만석)</span>}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <FormShareDialog formId={form.id} formTitle={form.title} />

                  <Link
                    href={`/forms/${form.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>신청 심사 및 체크인 관리</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

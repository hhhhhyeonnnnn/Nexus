import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  Ticket,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { getEventFormDetail, deleteEventForm, updateEventForm } from "@/features/forms/actions";
import { SubmissionsTable } from "@/features/forms/components/submissions-table";
import { CheckinView } from "@/features/forms/components/checkin-view";
import { FormShareDialog } from "@/features/forms/components/form-share-dialog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FormDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const currentTab = searchParams.tab || "submissions";

  const { form, submissions } = await getEventFormDetail(id);

  if (!form) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Navigation Breadcrumb */}
      <div>
        <Link
          href="/forms"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>신청 폼 목록으로 돌아가기</span>
        </Link>
      </div>

      {/* 2. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-xl border">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {form.category === "BOOTH" && "🎪 부스/주점 신청"}
              {form.category === "TICKET" && "🎫 티켓/입장권"}
              {form.category === "GENERAL" && "📋 일반 참가 신청"}
            </span>

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

            {form.projects && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {form.projects.name}
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-foreground">{form.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              <span>
                {form.start_at ? new Date(form.start_at).toLocaleDateString("ko-KR") : "상시"} ~{" "}
                {form.end_at ? new Date(form.end_at).toLocaleDateString("ko-KR") : "상시"}
              </span>
            </div>
            <div>
              정원: <span className="font-semibold text-foreground">{form.max_capacity ? `${form.max_capacity}명` : "무제한"}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <FormShareDialog formId={form.id} formTitle={form.title} />

          {/* Quick status toggle form action */}
          <form
            action={async () => {
              "use server";
              const nextStatus = form.status === "OPEN" ? "CLOSED" : "OPEN";
              const fd = new FormData();
              fd.set("title", form.title);
              fd.set("description", form.description);
              fd.set("category", form.category);
              fd.set("status", nextStatus);
              if (form.project_id) fd.set("project_id", form.project_id);
              if (form.max_capacity) fd.set("max_capacity", String(form.max_capacity));
              await updateEventForm(form.id, fd);
            }}
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-xs h-8"
            >
              {form.status === "OPEN" ? "🔴 조기 마감하기" : "🟢 모집 시작하기"}
            </Button>
          </form>
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="flex items-center gap-2 border-b">
        <Link
          href={`/forms/${form.id}?tab=submissions`}
          className={`pb-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            currentTab === "submissions"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-3.5" />
          <span>신청자 관리 & 심사 ({form.totalSubmissions})</span>
        </Link>
        <Link
          href={`/forms/${form.id}?tab=checkin`}
          className={`pb-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            currentTab === "checkin"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="size-3.5" />
          <span>현장 체크인 데스크 ({form.checkedInCount}/{form.approvedCount})</span>
        </Link>
        <Link
          href={`/forms/${form.id}?tab=settings`}
          className={`pb-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            currentTab === "settings"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="size-3.5" />
          <span>폼 설정 및 안내문</span>
        </Link>
      </div>

      {/* 4. Tab Content */}
      {currentTab === "submissions" && (
        <SubmissionsTable form={form} submissions={submissions} />
      )}

      {currentTab === "checkin" && (
        <CheckinView form={form} submissions={submissions} />
      )}

      {currentTab === "settings" && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">신청 폼 안내문</h3>
            <div className="p-4 rounded-lg bg-muted/20 text-xs text-muted-foreground whitespace-pre-wrap">
              {form.description || "(등록된 안내문이 없습니다)"}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">맞춤 질문 목록</h3>
            {Array.isArray(form.custom_fields) && (form.custom_fields as Array<{ label: string; type: string; required: boolean }>).length > 0 ? (
              <div className="divide-y text-xs">
                {(form.custom_fields as Array<{ label: string; type: string; required: boolean }>).map((f, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">{f.label}</span>
                      <span className="ml-2 text-muted-foreground text-[11px]">({f.type})</span>
                    </div>
                    <div>
                      {f.required ? (
                        <span className="text-destructive font-medium text-[11px]">필수</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">선택</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">추가 맞춤 질문이 없습니다.</p>
            )}
          </div>

          {/* Danger Zone: Delete Form */}
          <div className="pt-6 border-t space-y-3">
            <h3 className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              위험 구역
            </h3>
            <p className="text-xs text-muted-foreground">
              신청 폼을 삭제하면 관련된 모든 신청 내역과 발급된 티켓 데이터가 영구적으로 삭제됩니다.
            </p>
            <form
              action={async () => {
                "use server";
                await deleteEventForm(form.id);
              }}
            >
              <Button type="submit" variant="destructive" size="sm" className="text-xs">
                이 신청 폼 영구 삭제
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

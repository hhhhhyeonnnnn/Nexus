import Link from "next/link";
import { Ticket } from "lucide-react";
import { getPublicEventForm, type CustomField } from "@/features/forms/actions";
import { PublicApplicationForm } from "@/features/forms/components/public-application-form";

export const dynamic = "force-dynamic";

export default async function PublicApplyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { form, currentSubmissionsCount } = await getPublicEventForm(id);

  if (!form) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center space-y-4 shadow-sm">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Ticket className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-foreground">신청 폼을 찾을 수 없습니다</h1>
            <p className="text-xs text-muted-foreground">
              신청이 종료되었거나 비공개 상태의 폼입니다. 주최 학생회에 문의해 주세요.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-xs font-semibold text-primary hover:underline pt-2"
          >
            학생회 로그인 바로가기 →
          </Link>
        </div>
      </div>
    );
  }

  const org = form.organizations;
  const customFields = (form.custom_fields as unknown as CustomField[]) || [];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Public Header */}
      <header className="border-b bg-card/80 backdrop-blur-xs sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              N
            </span>
            <div>
              <span className="block font-bold text-xs text-foreground">
                {org?.university_name} {org?.name}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Nexus 학생회 온라인 접수 시스템
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            학생회 관리자 로그인
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 md:py-12 px-4">
        <PublicApplicationForm
          formId={form.id}
          formTitle={form.title}
          formDescription={form.description}
          category={form.category as "BOOTH" | "TICKET" | "GENERAL"}
          maxCapacity={form.max_capacity}
          currentCount={currentSubmissionsCount}
          endAt={form.end_at}
          customFields={customFields}
          orgName={org?.name ?? "학생회"}
          universityName={org?.university_name ?? "대학교"}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-card">
        <p>Powered by Nexus · 학생회 통합 운영 시스템</p>
      </footer>
    </div>
  );
}

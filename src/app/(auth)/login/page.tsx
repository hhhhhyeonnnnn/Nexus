import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { SocialButtons } from "@/features/auth/components/social-buttons";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const callbackError = params.error === "auth_callback_failed";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Nexus</h1>
        <p className="mt-1 text-sm text-muted-foreground">학생회 운영 플랫폼에 로그인하세요</p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          {callbackError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              로그인 중 오류가 발생했습니다. 다시 시도해 주세요.
            </p>
          )}

          <LoginForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground">또는</span>
            </div>
          </div>

          <SocialButtons />
        </div>
      </div>
    </div>
  );
}

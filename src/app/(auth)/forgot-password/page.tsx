"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/features/auth/actions";

const INITIAL_STATE = { error: null as string | null, success: false };

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPassword, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">비밀번호 찾기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          가입한 이메일로 재설정 링크를 보내드립니다
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {state.success ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-foreground">
              입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
              <br />
              메일함을 확인해 주세요.
            </p>
            <a href="/login" className="text-sm text-primary hover:underline">
              로그인으로 돌아가기
            </a>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                disabled={isPending}
              />
            </div>

            {state.error && (
              <p role="alert" className="text-xs text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "전송 중…" : "재설정 링크 보내기"}
            </Button>

            <a
              href="/login"
              className="text-center text-xs text-muted-foreground hover:text-primary"
            >
              로그인으로 돌아가기
            </a>
          </form>
        )}
      </div>
    </div>
  );
}

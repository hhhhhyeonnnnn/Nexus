"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/features/auth/actions";

const INITIAL_STATE = { error: null as string | null };

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState(resetPassword, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">새 비밀번호 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">8자 이상의 새 비밀번호를 입력해 주세요</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">새 비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          {state.error && (
            <p role="alert" className="text-xs text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "변경 중…" : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    </div>
  );
}

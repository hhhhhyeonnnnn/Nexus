"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithEmail } from "@/features/auth/actions";

const INITIAL_STATE = { error: null as string | null };

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginWithEmail, INITIAL_STATE);

  return (
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">비밀번호</Label>
          <a
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
          >
            비밀번호 찾기
          </a>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
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
        {isPending ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestCreateOrganization, type ActionState } from "@/features/organizations/actions";

const INITIAL_STATE: ActionState = { error: null };

export function CreateOrgRequestForm() {
  const [state, action, isPending] = useActionState(requestCreateOrganization, INITIAL_STATE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="university_name">대학교 이름</Label>
        <Input
          id="university_name"
          name="university_name"
          required
          placeholder="예: 서울대학교, 연세대학교"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org_name">학생회(조직) 이름</Label>
        <Input
          id="org_name"
          name="org_name"
          required
          placeholder="예: 제56대 총학생회, 공과대학 학생회"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">신청 사유 및 비고 (선택)</Label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="운영자에게 전달할 추가 정보를 입력하세요"
          disabled={isPending}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" asChild disabled={isPending}>
          <a href="/onboarding">취소</a>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "신청서 제출 중…" : "생성 신청하기"}
        </Button>
      </div>
    </form>
  );
}

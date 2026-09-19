"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization, type ActionState } from "@/features/organizations/actions";

const INITIAL_STATE: ActionState = { error: null };

export function CreateOrgForm() {
  const [state, action, isPending] = useActionState(createOrganization, INITIAL_STATE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="university_name">대학교 이름</Label>
        <Input
          id="university_name"
          name="university_name"
          required
          maxLength={100}
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
          maxLength={100}
          placeholder="예: 제56대 총학생회, 공과대학 학생회"
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
          {isPending ? "학생회 생성 중…" : "학생회 만들기"}
        </Button>
      </div>
    </form>
  );
}

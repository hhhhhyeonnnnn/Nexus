"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestJoinOrganization, type ActionState } from "@/features/organizations/actions";

const INITIAL_STATE: ActionState = { error: null };

type OrgItem = {
  id: string;
  name: string;
  university_name: string;
};

export function JoinOrgForm({ organizations }: { organizations: OrgItem[] }) {
  const [state, action, isPending] = useActionState(requestJoinOrganization, INITIAL_STATE);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const filtered = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.university_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={selectedOrgId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="search">학생회 검색</Label>
        <Input
          id="search"
          type="text"
          placeholder="대학교명 또는 학생회 이름 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>가입할 학생회 선택</Label>
        <div className="max-h-52 overflow-y-auto rounded-md border border-border bg-background p-2">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {organizations.length === 0
                ? "등록된 학생회가 없습니다. 먼저 새 학생회를 신청해 보세요."
                : "검색 결과가 없습니다."}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((org) => {
                const isSelected = selectedOrgId === org.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {org.university_name}
                      </div>
                    </div>
                    {isSelected && <span className="text-xs">선택됨</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">가입 신청 메시지 (선택)</Label>
        <textarea
          id="message"
          name="message"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="학과, 학번, 담당 부서 등 관리자가 확인할 수 있는 소개를 입력하세요"
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
        <Button type="submit" disabled={isPending || !selectedOrgId}>
          {isPending ? "신청 중…" : "가입 신청 보내기"}
        </Button>
      </div>
    </form>
  );
}

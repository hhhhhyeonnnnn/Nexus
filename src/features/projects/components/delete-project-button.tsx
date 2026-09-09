"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/features/projects/actions";

export function DeleteProjectButton({ projectId, isManager }: { projectId: string; isManager: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isManager) return null;

  const handleDelete = () => {
    if (!confirm("이 프로젝트를 정말 삭제하시겠습니까? 관련된 모든 데이터(업무 등)가 삭제될 수 있습니다.")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProject(projectId);
      if (res.error) {
        alert(res.error);
      } else {
        router.push("/projects");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:bg-destructive/10 text-xs gap-1.5"
    >
      <Trash2 className="size-3.5" />
      <span>{isPending ? "삭제 중…" : "프로젝트 삭제"}</span>
    </Button>
  );
}

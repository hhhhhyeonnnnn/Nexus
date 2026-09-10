export const DEPARTMENT_COLORS = [
  { value: "blue", label: "블루 (기획/총괄)", dot: "bg-blue-500" },
  { value: "emerald", label: "에메랄드 (사무/재정)", dot: "bg-emerald-500" },
  { value: "purple", label: "퍼플 (홍보/디자인)", dot: "bg-purple-500" },
  { value: "amber", label: "앰버 (복지/대외협력)", dot: "bg-amber-500" },
  { value: "rose", label: "로즈 (문화/행사)", dot: "bg-rose-500" },
  { value: "indigo", label: "인디고 (학술/정보)", dot: "bg-indigo-500" },
] as const;

export function getDepartmentColorClasses(color?: string | null) {
  switch (color) {
    case "blue":
      return {
        badge: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-300",
        dot: "bg-blue-500",
        borderTop: "border-t-blue-500",
        text: "text-blue-600 dark:text-blue-400",
      };
    case "emerald":
      return {
        badge: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-300",
        dot: "bg-emerald-500",
        borderTop: "border-t-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
      };
    case "purple":
      return {
        badge: "bg-purple-500/10 text-purple-700 border-purple-200 dark:border-purple-800 dark:text-purple-300",
        dot: "bg-purple-500",
        borderTop: "border-t-purple-500",
        text: "text-purple-600 dark:text-purple-400",
      };
    case "amber":
      return {
        badge: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-300",
        dot: "bg-amber-500",
        borderTop: "border-t-amber-500",
        text: "text-amber-600 dark:text-amber-400",
      };
    case "rose":
      return {
        badge: "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-800 dark:text-rose-300",
        dot: "bg-rose-500",
        borderTop: "border-t-rose-500",
        text: "text-rose-600 dark:text-rose-400",
      };
    case "indigo":
      return {
        badge: "bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:border-indigo-800 dark:text-indigo-300",
        dot: "bg-indigo-500",
        borderTop: "border-t-indigo-500",
        text: "text-indigo-600 dark:text-indigo-400",
      };
    default:
      return {
        badge: "bg-muted text-muted-foreground border-border",
        dot: "bg-muted-foreground",
        borderTop: "border-t-muted-foreground",
        text: "text-muted-foreground",
      };
  }
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

import type { Metadata } from "next";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Nexus · 학생회 OS", template: "%s | Nexus" },
  description: "학생회의 업무와 기억을 다음 기수까지 이어주는 통합 운영 플랫폼",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

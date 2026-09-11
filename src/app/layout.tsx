import type { Metadata, Viewport } from "next";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexus-kappa-two-10.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Nexus · 학생회 OS", template: "%s | Nexus" },
  description: "학생회의 업무와 기억을 다음 기수까지 이어주는 통합 운영 플랫폼",
  applicationName: "Nexus",
  authors: [{ name: "Nexus Team" }],
  generator: "Next.js",
  keywords: [
    "학생회",
    "총학생회",
    "단과대학생회",
    "축제부스",
    "티켓발권",
    "예산결산",
    "전자결재",
    "Nexus",
  ],
  creator: "Nexus",
  publisher: "Nexus",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "Nexus 학생회 OS",
    title: "Nexus · 학생회 OS",
    description: "학생회의 업무와 기억을 다음 기수까지 이어주는 통합 운영 플랫폼",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus · 학생회 OS",
    description: "학생회의 업무와 기억을 다음 기수까지 이어주는 통합 운영 플랫폼",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nexus",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#5b5bd6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/apple-icon" />
      </head>
      <body>{children}</body>
    </html>
  );
}

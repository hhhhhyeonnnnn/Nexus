"use client";

import { Button } from "@/components/ui/button";
import { loginWithGoogle, loginWithKakao, loginWithNaver } from "@/features/auth/actions";

// Social providers that require Supabase Dashboard configuration.
// Disable buttons for providers not yet configured to prevent broken flows.
// Set NEXT_PUBLIC_SOCIAL_GOOGLE=true etc. in .env.local once configured.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_SOCIAL_GOOGLE === "true";
const KAKAO_ENABLED = process.env.NEXT_PUBLIC_SOCIAL_KAKAO === "true";
const NAVER_ENABLED = process.env.NEXT_PUBLIC_SOCIAL_NAVER === "true";

export function SocialButtons() {
  return (
    <div className="flex flex-col gap-2">
      <form action={loginWithGoogle}>
        <Button
          type="submit"
          variant="outline"
          className="w-full gap-2"
          disabled={!GOOGLE_ENABLED}
          title={!GOOGLE_ENABLED ? "Google 로그인 미설정" : undefined}
        >
          <GoogleIcon />
          Google로 계속하기
          {!GOOGLE_ENABLED && (
            <span className="ml-auto text-xs text-muted-foreground">(준비 중)</span>
          )}
        </Button>
      </form>

      <form action={loginWithKakao}>
        <Button
          type="submit"
          variant="outline"
          className="w-full gap-2"
          disabled={!KAKAO_ENABLED}
          title={!KAKAO_ENABLED ? "Kakao 로그인 미설정" : undefined}
        >
          <KakaoIcon />
          카카오로 계속하기
          {!KAKAO_ENABLED && (
            <span className="ml-auto text-xs text-muted-foreground">(준비 중)</span>
          )}
        </Button>
      </form>

      <form action={loginWithNaver}>
        <Button
          type="submit"
          variant="outline"
          className="w-full gap-2"
          disabled={!NAVER_ENABLED}
          title={!NAVER_ENABLED ? "Naver 로그인 미설정" : undefined}
        >
          <NaverIcon />
          네이버로 계속하기
          {!NAVER_ENABLED && (
            <span className="ml-auto text-xs text-muted-foreground">(준비 중)</span>
          )}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons — avoids external image dependencies
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#3A1D1D" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.618 1.547 4.917 3.896 6.296l-.988 3.656a.25.25 0 00.365.284L9.73 18.25A10.62 10.62 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#03C75A" aria-hidden="true">
      <path d="M13.74 12.3L9.8 6H6v12h4.26V11.7L14.2 18H18V6h-4.26z" />
    </svg>
  );
}

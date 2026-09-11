"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Nexus Root Global Error]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#0b0c10",
          color: "#f3f4f6",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "440px",
              width: "100%",
              backgroundColor: "#161822",
              border: "1px solid #282c3f",
              borderRadius: "0.75rem",
              padding: "2rem",
              boxShadow: "0 20px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 1.25rem",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            >
              !
            </div>

            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                margin: "0 0 0.5rem",
                color: "#ffffff",
              }}
            >
              시스템 긴급 오류가 발생했습니다
            </h1>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#9ca3af",
                lineHeight: "1.5",
                margin: "0 0 1.25rem",
              }}
            >
              애플리케이션 최상위 레이아웃에서 문제가 발생했습니다. 브라우저를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>

            {error.digest && (
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "#202330",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#9ca3af",
                  marginBottom: "1.5rem",
                }}
              >
                오류 식별 코드: {error.digest}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: error.digest ? "0" : "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  backgroundColor: "#5b5bd6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                다시 시도
              </button>

              <Link
                href="/"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  backgroundColor: "#202330",
                  color: "#e5e7eb",
                  border: "1px solid #374151",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                메인으로 이동
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #0f172a 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(91, 91, 214, 0.45) 0%, rgba(91, 91, 214, 0) 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#5b5bd6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 900,
              color: "#ffffff",
              boxShadow: "0 10px 25px rgba(91, 91, 214, 0.4)",
            }}
          >
            N
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>Nexus</span>
            <span style={{ fontSize: "16px", color: "#a5b4fc", fontWeight: 500 }}>Student Council OS</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-1px",
              margin: 0,
            }}
          >
            학생회의 업무와 기억을 다음 기수까지
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            대학 학생 자치기구를 위한 차세대 통합 운영체제
          </p>

          {/* Feature Pills */}
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              ✓ 회계·영수증 OCR
            </span>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              ✓ 축제·티켓 발권
            </span>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              ✓ 전자결재
            </span>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              ✓ 실시간 동기화
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
            fontSize: "16px",
            color: "#64748b",
          }}
        >
          <span>https://nexus-kappa-two-10.vercel.app</span>
          <span>대학 학생 자치기구 공식 운영 플랫폼</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

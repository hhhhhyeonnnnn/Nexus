import { ImageResponse } from "next/og";
import { getPublicEventForm } from "@/features/forms/actions";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { form } = await getPublicEventForm(id);

  const title = form?.title || "학생회 행사 및 축제 신청";
  const org = form?.organizations;
  const orgName = `${org?.university_name ?? ""} ${org?.name ?? "학생회"}`.trim();
  const categoryLabel =
    form?.category === "BOOTH"
      ? "🎪 축제 부스 접수"
      : form?.category === "TICKET"
      ? "🎟️ 공식 행사 티켓 예매"
      : "📝 학생회 참가 신청";

  const capacityText = form?.max_capacity
    ? `모집 정원: ${form.max_capacity}명 (선착순)`
    : "인원 제한 없음 (상시 접수)";

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
          background: "linear-gradient(135deg, #090d16 0%, #17153a 50%, #0c1020 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "480px",
            height: "480px",
            background: "radial-gradient(circle, rgba(91, 91, 214, 0.4) 0%, rgba(91, 91, 214, 0) 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Top bar: Category Badge & Host */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(91, 91, 214, 0.25)",
              border: "1px solid rgba(91, 91, 214, 0.5)",
              padding: "10px 22px",
              borderRadius: "30px",
              fontSize: "20px",
              fontWeight: 700,
              color: "#c7d2fe",
            }}
          >
            {categoryLabel}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "20px",
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            <span>{orgName}</span>
          </div>
        </div>

        {/* Center: Event Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "950px" }}>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-1px",
              margin: 0,
              color: "#ffffff",
            }}
          >
            {title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontSize: "22px",
                color: "#cbd5e1",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "8px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              ⚡ {capacityText}
            </span>
            <span
              style={{
                fontSize: "22px",
                color: "#10b981",
                fontWeight: 600,
              }}
            >
              ● 온라인 실시간 접수 중
            </span>
          </div>
        </div>

        {/* Bottom bar: Nexus branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#5b5bd6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              N
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px" }}>
              Nexus 온라인 접수 시스템
            </span>
          </div>

          <span style={{ fontSize: "18px", color: "#64748b" }}>
            모바일 즉시 신청 및 모바일 티켓(QR) 발권
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

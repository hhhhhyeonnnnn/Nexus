import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 108,
          background: "linear-gradient(135deg, #5b5bd6 0%, #3730a3 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "40px",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          boxShadow: "inset 0 2px 10px rgba(255, 255, 255, 0.3)",
        }}
      >
        N
      </div>
    ),
    {
      ...size,
    }
  );
}

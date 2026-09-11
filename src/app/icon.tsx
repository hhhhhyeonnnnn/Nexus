import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#5b5bd6",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "7px",
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
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

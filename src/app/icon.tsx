import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32",
          height: "32",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            color: "#faf8f3",
            fontWeight: 700,
            display: "flex",
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}

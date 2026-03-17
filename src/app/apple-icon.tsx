import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180",
          height: "180",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          borderRadius: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "3px",
          }}
        >
          {/* Mini crossword grid icon */}
          {[0, 1, 2].map((r) => (
            <div key={r} style={{ display: "flex", gap: "3px" }}>
              {[0, 1, 2].map((c) => {
                const isBlack =
                  (r === 0 && c === 0) || (r === 2 && c === 2);
                return (
                  <div
                    key={c}
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: isBlack ? "#333" : "#faf8f3",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontFamily: "Georgia, serif",
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    {r === 1 && c === 1 ? "C" : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

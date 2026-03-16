import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Crossy — Mini crosswords on any topic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const sampleTopics = ["Jazz", "Space", "Dogs", "Cooking", "Movies", "Sports"];

const grid = [
  ["#", ".", ".", ".", "#"],
  [".", ".", ".", ".", "."],
  [".", ".", ".", ".", "."],
  [".", ".", ".", ".", "."],
  ["#", ".", ".", ".", "#"],
];

const letters = [
  ["", "S", "T", "A", ""],
  ["P", "I", "A", "N", "O"],
  ["A", "L", "I", "V", "E"],
  ["C", "R", "A", "N", "E"],
  ["", "L", "S", "T", ""],
];

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#faf8f3",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            bottom: "16px",
            border: "1.5px solid #d4d0c8",
            display: "flex",
          }}
        />

        {/* Left: text content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "80px",
            paddingRight: "40px",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              color: "#1a1a1a",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              lineHeight: 1,
              display: "flex",
            }}
          >
            Crossy
          </div>

          <div
            style={{
              width: "48px",
              height: "3px",
              backgroundColor: "#c9a84c",
              display: "flex",
            }}
          />

          <div
            style={{
              fontSize: "26px",
              color: "#1a1a1a",
              fontFamily: "Helvetica, sans-serif",
              fontWeight: 500,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            Mini crosswords on any topic
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {sampleTopics.map((topic) => (
              <div
                key={topic}
                style={{
                  fontSize: "14px",
                  color: "#c9a84c",
                  backgroundColor: "rgba(201, 168, 76, 0.1)",
                  border: "1px solid rgba(201, 168, 76, 0.25)",
                  padding: "5px 14px",
                  borderRadius: "20px",
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: 500,
                  display: "flex",
                }}
              >
                {topic}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "16px",
              color: "#6b6560",
              fontFamily: "Helvetica, sans-serif",
              marginTop: "12px",
              display: "flex",
            }}
          >
            crossygame.app
          </div>
        </div>

        {/* Right: crossword grid */}
        <div
          style={{
            width: "440px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              transform: "rotate(-3deg)",
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.08))",
            }}
          >
            {letters.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: "3px" }}>
                {row.map((cell, c) => {
                  const isBlack = grid[r][c] === "#";
                  return (
                    <div
                      key={c}
                      style={{
                        width: "56px",
                        height: "56px",
                        backgroundColor: isBlack ? "#1a1a1a" : "#ffffff",
                        border: isBlack ? "none" : "2px solid #1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontFamily: "Georgia, serif",
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      {!isBlack ? cell : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  // Sample grid patterns for visual interest
  const grids = [
    // cross4
    [
      ["#", ".", ".", ".", "#"],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      ["#", ".", ".", ".", "#"],
    ],
    // stair2
    [
      [".", ".", ".", ".", "#"],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      ["#", ".", ".", ".", "."],
    ],
    // diag2
    [
      [".", ".", ".", ".", "."],
      [".", "#", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", "#", "."],
      [".", ".", ".", ".", "."],
    ],
  ];

  const sampleTopics = [
    "Jazz",
    "Space",
    "Dogs",
    "Cooking",
    "Movies",
    "Sports",
  ];

  const sampleLetters = [
    ["", "S", "T", "A", ""],
    ["P", "I", "A", "N", "O"],
    ["A", "L", "I", "V", "E"],
    ["C", "R", "A", "N", "E"],
    ["", "L", "S", "T", ""],
  ];

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
        {/* Subtle border */}
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

        {/* Left side: text */}
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
          {/* Logo */}
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

          {/* Gold line */}
          <div
            style={{
              width: "48px",
              height: "3px",
              backgroundColor: "#c9a84c",
              display: "flex",
            }}
          />

          {/* Tagline */}
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

          {/* Topic pills */}
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

          {/* CTA text */}
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

        {/* Right side: grid display */}
        <div
          style={{
            width: "440px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Main filled grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              transform: "rotate(-3deg)",
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.08))",
            }}
          >
            {sampleLetters.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: "3px" }}>
                {row.map((cell, c) => {
                  const isBlack = grids[0][r][c] === "#";
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

          {/* Background ghost grids for depth */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              opacity: 0.08,
              transform: "rotate(6deg) scale(0.6)",
            }}
          >
            {grids[1].map((row, r) => (
              <div key={r} style={{ display: "flex", gap: "2px" }}>
                {row.map((cell, c) => (
                  <div
                    key={c}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: cell === "#" ? "#1a1a1a" : "#1a1a1a",
                      border: cell === "#" ? "none" : "2px solid #1a1a1a",
                      display: "flex",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "50px",
              right: "60px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              opacity: 0.05,
              transform: "rotate(-8deg) scale(0.5)",
            }}
          >
            {grids[2].map((row, r) => (
              <div key={r} style={{ display: "flex", gap: "2px" }}>
                {row.map((cell, c) => (
                  <div
                    key={c}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: cell === "#" ? "#1a1a1a" : "#1a1a1a",
                      border: cell === "#" ? "none" : "2px solid #1a1a1a",
                      display: "flex",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const time = searchParams.get("t"); // optional time param for competitive share

  let topic = "Mini Crossword";
  let gridSize = 5;

  try {
    const result = await db
      .select({ topic: puzzles.topic, size: puzzles.size })
      .from(puzzles)
      .where(eq(puzzles.id, id))
      .limit(1);

    if (result.length > 0) {
      topic = result[0].topic;
      gridSize = result[0].size;
    }
  } catch {
    // Fall through with defaults
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const timeDisplay = time ? formatTime(parseInt(time, 10)) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf8f3",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Subtle border frame */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            bottom: "20px",
            border: "2px solid #d4d0c8",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: "72px",
            color: "#1a1a1a",
            fontWeight: "400",
            fontStyle: "italic",
            marginBottom: "8px",
            display: "flex",
          }}
        >
          Crossy
        </div>

        {/* Topic badge */}
        <div
          style={{
            fontSize: "28px",
            color: "#c9a84c",
            backgroundColor: "rgba(201, 168, 76, 0.1)",
            padding: "8px 24px",
            borderRadius: "20px",
            border: "1px solid rgba(201, 168, 76, 0.3)",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          {topic}
        </div>

        {/* Mini grid preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            marginBottom: "32px",
          }}
        >
          {Array.from({ length: gridSize }).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: "3px" }}>
              {Array.from({ length: gridSize }).map((_, c) => (
                <div
                  key={c}
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor:
                      (r === 0 && c === 0) || (r === 4 && c === 4)
                        ? "#1a1a1a"
                        : "#ffffff",
                    border: "2px solid #1a1a1a",
                    display: "flex",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Challenge text */}
        {timeDisplay ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                color: "#1a1a1a",
                fontWeight: "700",
                fontStyle: "normal",
                fontFamily: "sans-serif",
                display: "flex",
              }}
            >
              Can you beat {timeDisplay}?
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b6560",
                fontFamily: "sans-serif",
                display: "flex",
              }}
            >
              crossygame.app
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                color: "#1a1a1a",
                fontFamily: "sans-serif",
                display: "flex",
              }}
            >
              AI-powered mini crosswords
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b6560",
                fontFamily: "sans-serif",
                display: "flex",
              }}
            >
              crossygame.app
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

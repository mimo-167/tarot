import { ImageResponse } from "next/og";

export const alt = "Moon & Stars Tarot — free online RWS tarot readings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          color: "#f8edcb",
          background: "linear-gradient(135deg, #09060f 0%, #1c102d 55%, #09060f 100%)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 430,
            height: 430,
            border: "1px solid rgba(224, 193, 121, .34)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 330,
            height: 330,
            border: "1px solid rgba(197, 166, 232, .3)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "absolute", right: 82, bottom: 62, fontSize: 44, color: "#e0c179" }}>☾</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "48px 80px",
            border: "1px solid rgba(248, 237, 203, .22)",
            background: "rgba(9, 6, 15, .72)",
          }}
        >
          <div style={{ color: "#e0c179", fontSize: 24, letterSpacing: 10 }}>MOON &amp; STARS</div>
          <div style={{ marginTop: 24, fontSize: 78, lineHeight: 1 }}>RWS TAROT</div>
          <div style={{ marginTop: 22, color: "#c5a6e8", fontSize: 27, letterSpacing: 4 }}>
            DRAW · REFLECT · DISCOVER
          </div>
        </div>
      </div>
    ),
    size,
  );
}

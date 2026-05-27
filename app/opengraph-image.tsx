import { ImageResponse } from "next/og";

export const alt = "AIV — AI Video Studio for Founders";
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
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: "#FAF6E8",
          backgroundImage:
            "linear-gradient(to right, rgba(31,58,138,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,58,138,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          color: "#0e1230",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Top — wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#1f3a8a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 32 32" width="48" height="48">
              <path d="M9 6 L9 26 L25.5 16 Z" fill="#FAF6E8" />
              <rect x="9" y="17" width="10.5" height="1.6" fill="#1f3a8a" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 44,
              letterSpacing: -1,
              fontStyle: "italic",
              color: "#0e1230",
            }}
          >
            AIV
          </div>
        </div>

        {/* Middle — headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.04,
              letterSpacing: -2,
              color: "#0e1230",
            }}
          >
            <span>The studio for </span>
            <span style={{ fontStyle: "italic", color: "#1f3a8a" }}>
              AI video
            </span>
            <span>, made for founders.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(14,18,48,0.65)",
              lineHeight: 1.35,
              fontFamily: "Helvetica, Arial, sans-serif",
              letterSpacing: -0.2,
              maxWidth: 880,
            }}
          >
            Brief, image, or reference link in. On-brand short-form video out —
            in minutes.
          </div>
        </div>

        {/* Bottom — meta strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 22,
            color: "rgba(14,18,48,0.55)",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          <span>Editorial · v1</span>
          <span>aiv.studio</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

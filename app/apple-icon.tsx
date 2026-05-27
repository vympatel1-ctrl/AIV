import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f3a8a",
          borderRadius: 38,
        }}
      >
        <svg viewBox="0 0 32 32" width="120" height="120">
          <path d="M9 6 L9 26 L25.5 16 Z" fill="#FAF6E8" />
          <rect x="9" y="17" width="10.5" height="1.6" fill="#1f3a8a" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { siteConfig } from "@/lib/constants/site";

// Branded social-share card (Open Graph + Twitter) for the homepage and every
// route that doesn't define its own. Rendered at 1200×630 — the size WhatsApp,
// LinkedIn, X, Facebook, etc. expect for a rich link preview. Embeds the real
// brand logo (read from /public at build/request time) rather than a placeholder.
export const alt = siteConfig.fullName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function logoDataUri(): string {
  try {
    const bytes = readFileSync(join(process.cwd(), "public/brand/logo128x128.png"));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

export default function OgImage() {
  const logo = logoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0b0f19 0%, #1e1b4b 55%, #4f46e5 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row — real logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={84} height={84} alt="" style={{ borderRadius: "20px" }} />
          ) : (
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "20px",
                background: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "44px",
                fontWeight: 800,
              }}
            >
              BS
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "38px", fontWeight: 700 }}>BloggerSpace</span>
            <span style={{ fontSize: "22px", color: "#c7d2fe" }}>by Teekam Singh</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.1, maxWidth: "1000px" }}>
            {siteConfig.tagline}
          </div>
          <div style={{ fontSize: "28px", color: "#cbd5e1", lineHeight: 1.4, maxWidth: "980px" }}>
            Every post reviewed by a real person before it goes live — thoughtful writing on
            technology, careers, and ideas.
          </div>
        </div>

        {/* Footer URL */}
        <div style={{ display: "flex", alignItems: "center", fontSize: "27px", color: "#a5b4fc" }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    size,
  );
}

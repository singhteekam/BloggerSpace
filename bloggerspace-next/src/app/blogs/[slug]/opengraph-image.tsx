import { ImageResponse } from "next/og";
import { fetchBlogBySlug } from "@/lib/api/blogs";
import { siteConfig } from "@/lib/constants/site";

export const runtime = "edge";
export const alt = "BloggerSpace blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchBlogBySlug(slug);
  const title = data?.blog.title ?? siteConfig.name;
  const author =
    data?.blog.authorDetails?.fullName ??
    data?.blog.authorDetails?.userName ??
    "BloggerSpace";
  const category = data?.blog.category ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: "linear-gradient(135deg, #0B0F19 0%, #1a1040 100%)",
          fontFamily: "serif",
        }}
      >
        {/* Top brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "auto",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #818CF8, #4F46E5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            BS
          </div>
          <span style={{ color: "#818CF8", fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>
            BloggerSpace
          </span>
        </div>

        {/* Category badge */}
        {category && (
          <div
            style={{
              display: "flex",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                background: "rgba(129,140,248,0.15)",
                border: "1px solid rgba(129,140,248,0.3)",
                color: "#818CF8",
                fontSize: 16,
                padding: "6px 16px",
                borderRadius: 999,
              }}
            >
              {category}
            </span>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? 44 : 56,
            fontWeight: 700,
            color: "#E4E4E7",
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: 1000,
            marginBottom: 32,
          }}
        >
          {title}
        </div>

        {/* Author + site */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#71717a", fontSize: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {author.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ color: "#a1a1aa" }}>{author}</span>
          <span style={{ color: "#52525b" }}>·</span>
          <span style={{ color: "#52525b" }}>bloggerspace.singhteekam.in</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

import type { Metadata } from "next";
import { siteConfig } from "@/lib/constants/site";

// Brand + owner identity keywords carried on every page so the site ranks for
// the owner's name and all brand spellings people might search.
export const BASE_KEYWORDS = [
  // ── Owner / brand identity ──
  "Teekam Singh",
  "teekam singh",
  "singhteekam",
  "Teekam Singh blog",
  "Teekam Singh blogs",
  "Teekam Singh developer",
  "Teekam Singh full stack developer",
  "Teekam Singh portfolio",
  "BloggerSpace",
  "Blogger Space",
  "blogger space",
  "BloggerSpace by Teekam Singh",
  "bloggerspace blog",

  // ── Blogging platform / product category ──
  "blogging platform",
  "blogging website",
  "best blogging platform",
  "free blogging platform",
  "blogging site",
  "online blogging platform",
  "create a blog",
  "start a blog",
  "start blogging",
  "write a blog",
  "write blog online",
  "publish blog online",
  "publish articles online",
  "free blog publishing",
  "blog hosting",
  "personal blog",
  "blog community",
  "writing community",
  "blog for writers",
  "platform for writers",
  "content writing platform",
  "article publishing platform",
  "reviewed blogs",
  "peer reviewed blog posts",
  "quality blogs",
  "read blogs",
  "read articles online",

  // ── Topic verticals people search ──
  "technology blog",
  "tech blog",
  "programming blog",
  "coding blog",
  "software development blog",
  "web development blog",
  "developer articles",
  "career blog",
  "career advice",
  "tutorials and guides",
];

/**
 * Per-page metadata builder. Produces a self-contained, correct set of SEO +
 * social tags for one route — crucially its OWN canonical + og:url + og:title,
 * so a shared sub-page never inherits (and impersonates) the homepage.
 *
 * `path` is the route path ("/blogs"); it is resolved to an absolute URL via the
 * `metadataBase` set in the root layout. The 1200×630 og:image comes from the
 * generated app/opengraph-image.tsx (file convention), so it is omitted here.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords = [],
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article" | "profile";
}): Metadata {
  const ogTitle = `${title} · ${siteConfig.name}`;
  return {
    title,
    description,
    keywords: [...keywords, ...BASE_KEYWORDS],
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      type,
      siteName: siteConfig.fullName,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants/site";
import { REVALIDATE } from "@/lib/constants/revalidate";

const BASE = siteConfig.url;
const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

// All publicly indexable pages. Auth/admin/reviewer/dashboard/maintenance routes
// are intentionally excluded (they carry X-Robots-Tag: noindex).
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE,                          changeFrequency: "daily",   priority: 1.0, lastModified: new Date() },
  { url: `${BASE}/blogs`,               changeFrequency: "hourly",  priority: 0.9 },
  { url: `${BASE}/adminblogs`,          changeFrequency: "daily",   priority: 0.8 },
  { url: `${BASE}/community`,           changeFrequency: "hourly",  priority: 0.8 },
  { url: `${BASE}/reviews`,             changeFrequency: "weekly",  priority: 0.6 },
  { url: `${BASE}/about`,               changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/guidelines`,          changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/aboutdeveloper`,      changeFrequency: "monthly", priority: 0.5 },
  // Public landing / conversion pages worth ranking
  { url: `${BASE}/signup`,                       changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/login`,                        changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/bloggerspace/apply-reviewer`,  changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/forgotpassword`,               changeFrequency: "yearly",  priority: 0.3 },
  { url: `${BASE}/privacypolicy`,       changeFrequency: "yearly",  priority: 0.3 },
  { url: `${BASE}/termsandconditions`,  changeFrequency: "yearly",  priority: 0.3 },
];

async function fetchAllBlogSlugs(): Promise<{ slug: string; lastModified?: Date }[]> {
  try {
    const res = await fetch(`${API}/api/blogs/sitemap`, {
      next: { revalidate: REVALIDATE.SITEMAP },
    });
    if (!res.ok) return [];
    const blogs: { slug: string; lastUpdatedAt?: string }[] = await res.json();
    return blogs.map((b) => ({
      slug: b.slug,
      lastModified: b.lastUpdatedAt ? new Date(b.lastUpdatedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchAllAuthorUsernames(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/api/blogs/authors/sitemap`, {
      next: { revalidate: REVALIDATE.SITEMAP },
    });
    if (!res.ok) return [];
    const authors: { userName: string }[] = await res.json();
    return authors.map((a) => a.userName).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchAllCommunityPostSlugs(): Promise<{ id: string; slug: string }[]> {
  try {
    const res = await fetch(`${API}/api/community/sitemap`, {
      next: { revalidate: REVALIDATE.SITEMAP },
    });
    if (!res.ok) return [];
    const posts: { communityPostId: string; communityPostSlug: string }[] = await res.json();
    return posts
      .filter((p) => p.communityPostId && p.communityPostSlug)
      .map((p) => ({ id: p.communityPostId, slug: p.communityPostSlug }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogSlugs, communityPosts, authorUsernames] = await Promise.all([
    fetchAllBlogSlugs(),
    fetchAllCommunityPostSlugs(),
    fetchAllAuthorUsernames(),
  ]);

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(({ slug, lastModified }) => ({
    url: `${BASE}/blogs/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    ...(lastModified ? { lastModified } : {}),
  }));

  const communityEntries: MetadataRoute.Sitemap = communityPosts.map(({ id, slug }) => ({
    // Actual route is /community/[communityPostId]/[communityPostSlug] — no "/post/".
    url: `${BASE}/community/${id}/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Public author profiles (only users who have published blogs).
  const profileEntries: MetadataRoute.Sitemap = authorUsernames.map((userName) => ({
    url: `${BASE}/user/${userName}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...STATIC_ROUTES, ...blogEntries, ...communityEntries, ...profileEntries];
}

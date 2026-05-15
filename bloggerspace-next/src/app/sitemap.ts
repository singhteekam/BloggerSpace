import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants/site";

const BASE = siteConfig.url;
const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE,                          changeFrequency: "daily",   priority: 1.0, lastModified: new Date() },
  { url: `${BASE}/blogs`,               changeFrequency: "hourly",  priority: 0.9 },
  { url: `${BASE}/community`,           changeFrequency: "hourly",  priority: 0.8 },
  { url: `${BASE}/about`,               changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/aboutdeveloper`,      changeFrequency: "monthly", priority: 0.4 },
  { url: `${BASE}/guidelines`,          changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/privacypolicy`,       changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE}/termsandconditions`,  changeFrequency: "monthly", priority: 0.3 },
];

async function fetchAllBlogSlugs(): Promise<{ slug: string; lastModified?: Date }[]> {
  try {
    const res = await fetch(`${API}/api/blogs/sitemap`, {
      next: { revalidate: 3600 },
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

async function fetchAllCommunityPostSlugs(): Promise<{ id: string; slug: string }[]> {
  try {
    const res = await fetch(`${API}/api/community/sitemap`, {
      next: { revalidate: 3600 },
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
  const [blogSlugs, communityPosts] = await Promise.all([
    fetchAllBlogSlugs(),
    fetchAllCommunityPostSlugs(),
  ]);

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map(({ slug, lastModified }) => ({
    url: `${BASE}/blogs/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    ...(lastModified ? { lastModified } : {}),
  }));

  const communityEntries: MetadataRoute.Sitemap = communityPosts.map(({ id, slug }) => ({
    url: `${BASE}/community/post/${id}/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...STATIC_ROUTES, ...blogEntries, ...communityEntries];
}

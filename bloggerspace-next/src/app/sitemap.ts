import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants/site";

const BASE = siteConfig.url;
const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "daily",   priority: 1.0, lastModified: new Date() },
  { url: `${BASE}/blogs`,     changeFrequency: "hourly",  priority: 0.9 },
  { url: `${BASE}/community`, changeFrequency: "hourly",  priority: 0.8 },
  { url: `${BASE}/about`,     changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/aboutdeveloper`, changeFrequency: "monthly", priority: 0.4 },
  { url: `${BASE}/guidelines`,     changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/privacypolicy`,  changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE}/termsandconditions`, changeFrequency: "monthly", priority: 0.3 },
];

async function fetchAllBlogSlugs(): Promise<{ slug: string; lastModified?: Date }[]> {
  try {
    const res = await fetch(`${API}/api/blogs/allblogs?page=1&limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const blogs: { slug: string; lastUpdatedAt?: string; createdAt?: string }[] =
      Array.isArray(data) ? data : (data.blogs ?? []);
    return blogs.map((b) => ({
      slug: b.slug,
      lastModified: b.lastUpdatedAt ? new Date(b.lastUpdatedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchAllBlogSlugs();

  const blogEntries: MetadataRoute.Sitemap = slugs.map(({ slug, lastModified }) => ({
    url: `${BASE}/blogs/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    ...(lastModified ? { lastModified } : {}),
  }));

  return [...STATIC_ROUTES, ...blogEntries];
}

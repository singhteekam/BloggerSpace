/**
 * Tool definitions for the BlogMate chatbot.
 *
 * Each tool is callable by the LLM during a streamed chat turn. The LLM picks
 * which tool(s) to invoke based on the user's intent. Tools return concise,
 * structured data (titles, URLs, authors, excerpts) so BlogMate can reply with
 * clickable Markdown links instead of fabricating blog titles.
 */
import { tool } from "ai";
import { z } from "zod";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const FETCH_TIMEOUT_MS = 4000;

// ── Shared types ─────────────────────────────────────────────────────────────
type RawBlog = {
  _id?: string;
  slug?: string;
  title?: string;
  category?: string;
  tags?: string[];
  content?: string;
  blogViews?: number;
  createdAt?: string;
  authorDetails?: { fullName?: string; userName?: string };
  author?: string;
};

type FormattedBlog = {
  title: string;
  url: string;
  author: string | null;
  authorUrl: string | null;
  category: string | null;
  tags: string[];
  excerpt: string | null;
  views: number | null;
  publishedAt: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function formatBlog(b: RawBlog): FormattedBlog | null {
  if (!b.slug || !b.title) return null;
  const username = b.authorDetails?.userName ?? null;
  const excerpt = b.content ? stripHtml(b.content).slice(0, 180) : null;
  return {
    title: b.title,
    url: `/blogs/${b.slug}`,
    author: b.authorDetails?.fullName ?? b.author ?? null,
    authorUrl: username ? `/user/${username}` : null,
    category: b.category ?? null,
    tags: Array.isArray(b.tags) ? b.tags.slice(0, 5) : [],
    excerpt: excerpt ? excerpt + (excerpt.length === 180 ? "…" : "") : null,
    views: typeof b.blogViews === "number" ? b.blogViews : null,
    publishedAt: b.createdAt ?? null,
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function unwrapBlogs(data: unknown): RawBlog[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as RawBlog[];
  if (typeof data === "object" && data !== null && "blogs" in data) {
    const blogs = (data as { blogs?: unknown }).blogs;
    return Array.isArray(blogs) ? (blogs as RawBlog[]) : [];
  }
  return [];
}

// ── Tools ────────────────────────────────────────────────────────────────────

const searchBlogs = tool({
  description:
    "Search BloggerSpace's published blogs by free-text query. Use this whenever the user asks to find a blog on a topic, asks 'do you have a blog about X', wants links to articles, or mentions a keyword they want to read about.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query, e.g. 'react hooks', 'system design', 'career advice'"),
    limit: z.number().int().min(1).max(8).default(5).describe("How many results to return (1-8)"),
  }),
  execute: async ({ query, limit }) => {
    const params = new URLSearchParams({ search: query, limit: String(limit) });
    const data = await fetchJson(`${BACKEND_URL}/api/blogs/fetchallblogs?${params}`);
    const blogs = unwrapBlogs(data).map(formatBlog).filter(Boolean).slice(0, limit) as FormattedBlog[];
    return {
      query,
      count: blogs.length,
      blogs,
      message: blogs.length === 0 ? `No blogs found matching "${query}".` : null,
    };
  },
});

const getRecentBlogs = tool({
  description:
    "Get the most recently published blogs on BloggerSpace. Use when the user asks for latest/new/recent blogs without naming a specific topic.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(8).default(5),
  }),
  execute: async ({ limit }) => {
    const data = await fetchJson(`${BACKEND_URL}/api/blogs/allblogs?page=1&limit=${limit}`);
    const blogs = unwrapBlogs(data).map(formatBlog).filter(Boolean).slice(0, limit) as FormattedBlog[];
    return { count: blogs.length, blogs };
  },
});

const getTopBlogs = tool({
  description:
    "Get the most-viewed (most popular / trending) blogs on BloggerSpace. Use when the user asks for trending, popular, top, or most-read blogs.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(8).default(5),
  }),
  execute: async ({ limit }) => {
    const data = await fetchJson(`${BACKEND_URL}/api/blogs/topviewedblogs`);
    const blogs = unwrapBlogs(data).map(formatBlog).filter(Boolean).slice(0, limit) as FormattedBlog[];
    return { count: blogs.length, blogs };
  },
});

const getBlogsByCategory = tool({
  description:
    "Get blogs filtered by a specific category name. Use when the user names a category they want to browse, e.g. 'show me Web Development blogs'.",
  inputSchema: z.object({
    category: z.string().min(1).describe("Exact category name, case-sensitive if possible"),
    limit: z.number().int().min(1).max(8).default(5),
  }),
  execute: async ({ category, limit }) => {
    const params = new URLSearchParams({
      filterType: "category",
      filterValue: category,
      page: "1",
      limit: String(limit),
    });
    const data = await fetchJson(`${BACKEND_URL}/api/blogs/fetchallblogs?${params}`);
    const blogs = unwrapBlogs(data).map(formatBlog).filter(Boolean).slice(0, limit) as FormattedBlog[];
    return { category, count: blogs.length, blogs };
  },
});

const getBlogsByTag = tool({
  description:
    "Get blogs filtered by a specific tag. Use when the user names a tag, e.g. 'blogs tagged javascript'.",
  inputSchema: z.object({
    tag: z.string().min(1).describe("Exact tag name"),
    limit: z.number().int().min(1).max(8).default(5),
  }),
  execute: async ({ tag, limit }) => {
    const params = new URLSearchParams({
      filterType: "tag",
      filterValue: tag,
      page: "1",
      limit: String(limit),
    });
    const data = await fetchJson(`${BACKEND_URL}/api/blogs/fetchallblogs?${params}`);
    const blogs = unwrapBlogs(data).map(formatBlog).filter(Boolean).slice(0, limit) as FormattedBlog[];
    return { tag, count: blogs.length, blogs };
  },
});

const listCategories = tool({
  description:
    "List all blog categories available on BloggerSpace. Use when the user asks what topics or categories exist, or what they can browse.",
  inputSchema: z.object({}),
  execute: async () => {
    const data = await fetchJson<{ categories?: string[] }>(`${BACKEND_URL}/api/blogs/categories`);
    return { categories: data?.categories ?? [] };
  },
});

const listTags = tool({
  description:
    "List all blog tags available on BloggerSpace. Use when the user asks what tags exist.",
  inputSchema: z.object({}),
  execute: async () => {
    const data = await fetchJson<{ tags?: string[] }>(`${BACKEND_URL}/api/blogs/tags`);
    return { tags: data?.tags ?? [] };
  },
});

export const chatTools = {
  searchBlogs,
  getRecentBlogs,
  getTopBlogs,
  getBlogsByCategory,
  getBlogsByTag,
  listCategories,
  listTags,
};

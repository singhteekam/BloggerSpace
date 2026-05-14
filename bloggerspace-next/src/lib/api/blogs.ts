import type { Blog, BlogListResponse } from "@/types/blog";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const LIMIT = 9;

export async function fetchBlogs(page = 1): Promise<BlogListResponse> {
  try {
    const res = await fetch(`${BASE}/api/blogs/allblogs?page=${page}&limit=${LIMIT}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return empty(page);
    return res.json();
  } catch {
    return empty(page);
  }
}

export async function fetchBlogsByCategory(
  category: string,
  page = 1,
): Promise<BlogListResponse> {
  try {
    const encoded = encodeURIComponent(category);
    const res = await fetch(
      `${BASE}/api/blogs/allblogs/category/${encoded}?page=${page}&limit=${LIMIT}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return empty(page);
    return res.json();
  } catch {
    return empty(page);
  }
}

export async function searchBlogs(query: string): Promise<Blog[]> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(`${BASE}/api/blogs/searchblogs/${encoded}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.blogs ?? []);
  } catch {
    return [];
  }
}

export async function fetchBlogBySlug(
  slug: string,
): Promise<{ blog: Blog; alreadyLiked: boolean } | null> {
  try {
    const res = await fetch(`${BASE}/api/blogs/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchRelatedBlogs(blogId: number): Promise<Blog[]> {
  try {
    const res = await fetch(`${BASE}/api/blogs/${blogId}/related`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.blogs ?? []);
  } catch {
    return [];
  }
}

export async function fetchTopBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch(`${BASE}/api/blogs/topviewedblogs`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.blogs ?? []);
  } catch {
    return [];
  }
}

export async function fetchAdminPublishedBlogs(page = 1): Promise<BlogListResponse> {
  try {
    const res = await fetch(`${BASE}/api/blogs/adminpublished?page=${page}&limit=${LIMIT}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return empty(page);
    return res.json();
  } catch {
    return empty(page);
  }
}

export async function fetchDistinctCategories(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/blogs/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export async function fetchDistinctTags(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/blogs/tags`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tags ?? [];
  } catch {
    return [];
  }
}

export async function fetchBlogsByTag(
  tag: string,
  page = 1,
): Promise<BlogListResponse> {
  try {
    const encoded = encodeURIComponent(tag);
    const res = await fetch(
      `${BASE}/api/blogs/fetchallblogs?filterType=tag&filterValue=${encoded}&page=${page}&limit=${LIMIT}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return empty(page);
    const data = await res.json();
    return {
      blogs: data.blogs ?? [],
      total: data.totalCount ?? 0,
      page: data.currentPage ?? page,
      pages: data.totalPages ?? 0,
    };
  } catch {
    return empty(page);
  }
}

function empty(page: number): BlogListResponse {
  return { blogs: [], total: 0, page, pages: 0 };
}

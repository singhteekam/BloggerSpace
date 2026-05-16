"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import type { Blog } from "@/types/blog";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const LIMIT = 9;

async function fetchPage(url: string): Promise<{ blogs: Blog[]; hasMore: boolean }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { blogs: [], hasMore: false };
    const data = await res.json();
    const blogs: Blog[] = data.blogs ?? [];
    const pages: number = data.pages ?? data.totalPages ?? 0;
    const currentPage: number = data.page ?? data.currentPage ?? 1;
    return { blogs, hasMore: currentPage < pages };
  } catch {
    return { blogs: [], hasMore: false };
  }
}

/**
 * Client component that renders an initial set of blog cards and automatically
 * loads more as the user scrolls to the bottom via IntersectionObserver.
 *
 * Pass `buildUrl(page)` to control which endpoint/params are used for subsequent pages.
 */
export function InfiniteBlogGrid({
  initialBlogs,
  initialHasMore,
  buildUrl,
}: {
  initialBlogs: Blog[];
  initialHasMore: boolean;
  /** Called with the NEXT page number (2, 3, …) to build the fetch URL */
  buildUrl: (page: number) => string;
}) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Prevent double-firing while a fetch is in-flight
  const fetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);
    const nextPage = page + 1;
    const { blogs: newBlogs, hasMore: more } = await fetchPage(buildUrl(nextPage));
    setBlogs((prev) => [...prev, ...newBlogs]);
    setPage(nextPage);
    setHasMore(more);
    setLoading(false);
    fetchingRef.current = false;
  }, [hasMore, page, buildUrl]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <BlogCard key={blog._id} blog={blog} />
        ))}
      </div>

      {/* Sentinel — triggers next load when it enters the viewport */}
      <div ref={sentinelRef} className="mt-10 flex h-12 items-center justify-center">
        {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {!loading && !hasMore && blogs.length > 0 && (
          <p className="text-xs text-muted-foreground">You&apos;ve reached the end.</p>
        )}
      </div>
    </>
  );
}

// ─── Pre-built URL factories ──────────────────────────────────────────────────

export function adminPublishedUrl(page: number) {
  return `${BASE}/api/blogs/adminpublished?page=${page}&limit=${LIMIT}`;
}

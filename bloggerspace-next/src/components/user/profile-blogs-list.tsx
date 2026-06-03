"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Eye, Heart, Star, Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchProfileBlogs, type PublicBlog, type ProfileBlogsResponse } from "@/lib/api/user";
import { formatDate } from "@/lib/utils/html";

// Renders an author's published blogs. The FIRST page is passed in from the
// server-rendered profile (so crawlers + first paint see content — SEO intact);
// further pages load on demand via "Load more". A search box runs a server-side
// search across ALL the author's published blogs (not just the loaded ones).
export function ProfileBlogsList({
  username,
  initialBlogs,
  total,
  pageSize,
}: {
  username: string;
  initialBlogs: PublicBlog[];
  total: number;
  pageSize: number;
}) {
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 400);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["profileBlogs", username, q],
    queryFn: ({ pageParam }) => fetchProfileBlogs(username, pageParam, q),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    // Seed the no-search view with the SSR first page so there's no refetch on
    // mount (keeps the server-rendered content; only "Load more"/search hit the API).
    initialData: q
      ? undefined
      : {
          pages: [
            {
              blogs: initialBlogs,
              total,
              page: 1,
              pages: Math.max(1, Math.ceil(total / pageSize)),
            } as ProfileBlogsResponse,
          ],
          pageParams: [1],
        },
    staleTime: 60 * 1000,
  });

  const blogs = data?.pages.flatMap((p) => p.blogs) ?? [];
  const matchTotal = data?.pages[0]?.total ?? 0;

  return (
    <>
      {/* Search across all of this author's published blogs */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this author's blogs…"
          className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : blogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? `No blogs match "${q}".` : "No published blogs yet."}
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {blogs.map((blog, i) => (
              <Link
                key={`${blog._id}-${i}`}
                href={`/blogs/${blog.slug}`}
                className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  {blog.category && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {blog.category}
                    </Badge>
                  )}
                </div>

                {blog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {blog.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" />
                    {(blog.blogViews ?? 0).toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3" />
                    {(blog.blogLikes?.length ?? 0).toLocaleString()} likes
                  </span>
                  {(blog.blogScore ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="size-3 fill-current" />
                      {blog.blogScore}
                    </span>
                  )}
                  {blog.lastUpdatedAt && <span>{formatDate(blog.lastUpdatedAt)}</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            {hasNextPage && (
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="gap-1.5">
                {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
                Load more ({(matchTotal - blogs.length).toLocaleString()} more)
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {blogs.length} of {matchTotal.toLocaleString()}{q && " matching"}
            </span>
          </div>
        </>
      )}
    </>
  );
}

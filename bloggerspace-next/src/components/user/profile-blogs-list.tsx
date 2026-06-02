"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchProfileBlogs, type PublicBlog } from "@/lib/api/user";
import { formatDate } from "@/lib/utils/html";

// Renders an author's published blogs. The FIRST page is passed in from the
// server-rendered profile (so crawlers + first paint see content — SEO intact);
// further pages load on demand via "Load more" instead of fetching all at once.
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
  const [blogs, setBlogs] = useState<PublicBlog[]>(initialBlogs);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = blogs.length < total;

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await fetchProfileBlogs(username, next);
      setBlogs((prev) => [...prev, ...res.blogs]);
      setPage(next);
    } catch {
      toast.error("Couldn't load more blogs. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (blogs.length === 0) {
    return <p className="text-sm text-muted-foreground">No published blogs yet.</p>;
  }

  return (
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

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Load more ({(total - blogs.length).toLocaleString()} more)
          </Button>
        </div>
      )}
    </>
  );
}

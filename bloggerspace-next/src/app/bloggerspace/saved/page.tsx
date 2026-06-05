"use client";

import Link from "next/link";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2, Loader2, ArrowRight, Search, X } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { userApi } from "@/lib/api/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedBlogsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 400);

  // Server-side search + "load more": filters across ALL the user's saved
  // blogs (not just the loaded page), then loads pages on demand.
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["savedblogs", user?._id, q],
    queryFn: ({ pageParam }) =>
      userApi.getSavedBlogs(user!._id, { page: pageParam, search: q }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    enabled: !!user,
  });

  const saved = data?.pages.flatMap((p) => p.blogs) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const remove = useMutation({
    mutationFn: (slug: string) => userApi.removeFromSaved(slug, user!._id),
    onSuccess: () => {
      toast.success("Removed from saved blogs.");
      // Refetch loaded pages so the list + total stay accurate.
      qc.invalidateQueries({ queryKey: ["savedblogs", user?._id] });
    },
    onError: (err) => {
      const msg = isAxiosError(err) ? (err.response?.data?.message ?? "Failed to remove.") : "Error.";
      toast.error(msg);
    },
  });

  if (authLoading || isLoading) return <SavedSkeleton />;
  if (!user) return null;

  // Show the search box once there's anything to search (or an active query).
  const showSearch = saved.length > 0 || q.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Bookmark className="size-6 text-primary" />
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Saved blogs</h1>
      </div>

      {showSearch && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved blogs by title or category…"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {saved.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bookmark className="size-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold">
            {q ? "No matching saved blogs" : "Nothing saved yet"}
          </h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {q
              ? `No saved blogs match "${q}".`
              : "Bookmark posts while reading and they'll appear here."}
          </p>
          {!q && (
            <Button asChild variant="outline">
              <Link href="/blogs">
                Browse blogs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="mb-4 text-sm text-muted-foreground">
            {total.toLocaleString()} saved {total === 1 ? "post" : "posts"}
            {q && " matching"}
          </p>
          {saved.map((blog) => (
            <div
              key={blog.slug}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1">
                  <Badge variant="secondary" className="text-xs">{blog.category}</Badge>
                </div>
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {blog.title}
                </Link>
                {blog.tags?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/blogs/${blog.slug}`}>Read</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  // Scope the spinner to the row actually being removed — `isPending`
                  // alone is shared, so every button would spin on a single click.
                  disabled={remove.isPending && remove.variables === blog.slug}
                  onClick={() => remove.mutate(blog.slug)}
                  aria-label="Remove from saved"
                >
                  {remove.isPending && remove.variables === blog.slug ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          <div className="mt-5 flex flex-col items-center gap-2">
            {hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage && <Loader2 className="size-3.5 animate-spin" />}
                Load more ({(total - saved.length).toLocaleString()} more)
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {saved.length} of {total.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

function SavedSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Skeleton className="mb-8 h-9 w-44" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  );
}

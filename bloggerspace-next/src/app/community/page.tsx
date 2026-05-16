"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageSquare, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { communityApi } from "@/lib/api/community";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/html";
import type { CommunityPost } from "@/lib/api/community";

export default function CommunityPage() {
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["community-posts"],
    queryFn: ({ pageParam }) => communityApi.getPosts(pageParam).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // IntersectionObserver sentinel — triggers next page fetch
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Community</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discussions, questions, and ideas from the BloggerSpace community.
          </p>
        </div>
        {user ? (
          <Button asChild size="sm">
            <Link href="/community/new">
              New post
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Sign in to post</Link>
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="size-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold">No discussions yet</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Be the first to start a conversation.
          </p>
          {user && (
            <Button asChild>
              <Link href="/community/new">Start a discussion</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {posts.map((post) => <PostRow key={post._id} post={post} />)}
          </div>

          {/* Sentinel */}
          <div ref={sentinelRef} className="mt-6 flex h-10 items-center justify-center">
            {isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : !hasNextPage ? (
              <p className="text-xs text-muted-foreground">
                {total} discussion{total !== 1 ? "s" : ""} total
              </p>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}

function PostRow({ post }: { post: CommunityPost }) {
  const authorName =
    post.communityPostAuthor?.fullName ??
    post.communityPostAuthor?.userName ??
    "Anonymous";
  const replyCount = post.communityPostComments?.length ?? 0;
  const date = formatDate(post.lastUpdatedAt || post.createdAt || "");

  return (
    <Link
      href={`/community/${post.communityPostId}/${post.communityPostSlug}`}
      className="group flex items-start gap-4 py-4 transition-colors hover:text-primary"
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <MessageSquare className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {post.communityPostCategory && (
            <Badge variant="secondary" className="text-xs">
              {post.communityPostCategory}
            </Badge>
          )}
        </div>
        <p className="line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
          {post.communityPostTopic}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{authorName}</span>
          {date && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {date}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </span>
        </div>
      </div>
    </Link>
  );
}

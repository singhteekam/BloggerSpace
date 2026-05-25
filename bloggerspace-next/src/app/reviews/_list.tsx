"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { reviewsApi } from "@/lib/api/reviews";
import { ReviewCard } from "@/app/_sections/reviews-section";
import { WriteReviewButton } from "@/app/_sections/write-review-button";

const LIMIT = 12;

export function AllReviewsList() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["reviews-all"],
      queryFn: ({ pageParam }) =>
        reviewsApi.getApproved(pageParam, LIMIT).then((r) => r.data),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
      staleTime: 5 * 60_000,
    });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const reviews = data?.pages.flatMap((p) => p.reviews) ?? [];
  const total   = data?.pages[0]?.total ?? 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No reviews yet — be the first!</p>
        <WriteReviewButton />
      </div>
    );
  }

  return (
    <>
      {total > 0 && (
        <p className="mb-6 text-sm text-muted-foreground">
          {reviews.length} of {total} review{total !== 1 ? "s" : ""}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>

      {/* Sentinel */}
      <div ref={sentinelRef} className="mt-10 flex justify-center">
        {isFetchingNextPage && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && (
          <p className="text-sm text-muted-foreground">You&apos;ve seen all {total} reviews.</p>
        )}
      </div>
    </>
  );
}

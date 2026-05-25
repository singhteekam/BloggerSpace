"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { Star, ExternalLink, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";
import type { Review } from "@/lib/api/reviews";

// ── Server wrapper (called from the RSC page) ─────────────────────────────────
// This file is intentionally "use client" so it can be imported in server pages
// too — Next.js allows server components to render client components.

interface ReviewsSectionProps {
  reviews: Review[];
  total: number;
}

export function ReviewsSection({ reviews, total }: ReviewsSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Reviews</Badge>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              What our users say
            </h2>
            <p className="mt-3 max-w-lg text-balance text-muted-foreground">
              Real feedback from writers and reviewers who call BloggerSpace home.
            </p>
          </div>
          <Link href="/reviews">
            <Button variant="outline" className="shrink-0 gap-2">
              See all reviews
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {reviews.length > 0 ? (
          <ReviewsCarousel reviews={reviews} total={total} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No reviews yet — be the first!
          </p>
        )}
      </div>
    </section>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────
function ReviewsCarousel({ reviews, total }: { reviews: Review[]; total: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const cardWidth = card.offsetWidth + 16; // 16 = gap-4
    setCurrentIndex(Math.round(el.scrollLeft / cardWidth));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateIndex);
  }, [updateIndex]);

  function navigate(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const cardWidth = card.offsetWidth + 16;
    el.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  }

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < reviews.length - 1;

  return (
    <div>
      {/* Counter + arrows */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="mr-2 text-sm tabular-nums text-muted-foreground">
          {currentIndex + 1} / {reviews.length}
          {total > reviews.length && (
            <span className="text-xs"> (showing {reviews.length} of {total})</span>
          )}
        </span>
        <button
          onClick={() => navigate(-1)}
          disabled={!canPrev}
          aria-label="Previous"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          disabled={!canNext}
          aria-label="Next"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {reviews.map((r) => (
          <div
            key={r._id}
            className="w-[min(300px,80vw)] shrink-0 [scroll-snap-align:start]"
          >
            <ReviewCard review={r} />
          </div>
        ))}

        {/* "See all" end-card */}
        {total > reviews.length && (
          <div className="w-[min(300px,80vw)] shrink-0 [scroll-snap-align:start]">
            <Link
              href="/reviews"
              className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">See all {total} reviews</p>
              <p className="text-xs text-muted-foreground">View every review with infinite scroll</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function ReviewCard({ review }: { review: Review }) {
  const profileHref = review.userName ? `/user/${review.userName}` : null;

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="mb-3 flex items-center gap-3">
        <UserAvatar src={review.profilePicture} name={review.fullName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{review.fullName}</p>
          <div className="mt-0.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${i < review.rating ? "fill-accent text-accent" : "fill-muted text-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="line-clamp-4 flex-1 text-sm leading-6 text-muted-foreground italic">
        &ldquo;{review.body}&rdquo;
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {new Date(review.approvedAt ?? review.createdAt).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          })}
        </span>
        {profileHref && (
          <Link
            href={profileHref}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View profile <ExternalLink className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

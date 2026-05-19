import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { Marquee } from "@/components/animated/marquee";
import { fetchApprovedReviews, type Review } from "@/lib/api/reviews";
import { UserAvatar } from "@/components/user/user-avatar";
import { WriteReviewButton } from "./write-review-button";

export async function ReviewsSection() {
  const reviews = await fetchApprovedReviews();

  return (
    <section className="overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">Reviews</Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            What our users say
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
            Real feedback from writers and reviewers who call BloggerSpace home.
          </p>
          <div className="mt-6">
            <WriteReviewButton />
          </div>
        </ScrollReveal>
      </div>

      {reviews.length > 0 ? (
        <Marquee duration={40}>
          {reviews.map((r) => (
            <ReviewCard key={r._id} review={r} />
          ))}
        </Marquee>
      ) : (
        <p className="text-center text-sm text-muted-foreground">No reviews yet — be the first!</p>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const profileHref = review.userName ? `/user/${review.userName}` : null;

  return (
    <div className="mx-3 flex h-50 w-72 shrink-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <UserAvatar src={review.profilePicture} name={review.fullName} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{review.fullName}</p>
          <div className="mt-0.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${
                  i < review.rating
                    ? "fill-accent text-accent"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="line-clamp-4 flex-1 text-sm leading-6 text-muted-foreground italic">{review.body}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {review.approvedAt
            ? new Date(review.approvedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
            : new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
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

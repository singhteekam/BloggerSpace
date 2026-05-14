import { ShieldCheck, Star, MessageCircle } from "lucide-react";
import { formatDate } from "@/lib/utils/html";
import type { ReviewFeedback, ReviewRecord } from "@/types/blog";

type Props = {
  reviewedBy?: ReviewRecord[];
  feedbackToAuthor?: ReviewFeedback[];
};

export function ReviewerNotes({ reviewedBy, feedbackToAuthor }: Props) {
  const hasReviews = reviewedBy && reviewedBy.length > 0;
  const hasFeedback = feedbackToAuthor && feedbackToAuthor.length > 0;

  if (!hasReviews && !hasFeedback) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-8">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
        <ShieldCheck className="size-4.5 text-primary" />
        Reviewer notes
      </h2>

      <div className="space-y-3">
        {reviewedBy?.map((r, i) => {
          if (!r.Remarks) return null;
          const role = r.ReviewedBy?.Role ?? "Reviewer";
          const email = r.ReviewedBy?.Email;
          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-muted/40 p-4 text-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  {role}{email ? ` · ${email}` : ""}
                </span>
                <div className="flex items-center gap-1">
                  {r.Rating != null && (
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="size-3 fill-amber-400" />
                      {r.Rating}/5
                    </span>
                  )}
                  {r.LastUpdatedAt && (
                    <span className="text-xs text-muted-foreground">
                      · {formatDate(r.LastUpdatedAt)}
                    </span>
                  )}
                </div>
              </div>
              <p className="leading-relaxed text-foreground/80">{r.Remarks}</p>
            </div>
          );
        })}

        {feedbackToAuthor?.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-muted/40 p-4 text-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <MessageCircle className="size-3.5 text-primary" />
                Feedback{f.ReviewerEmail ? ` · ${f.ReviewerEmail}` : ""}
              </span>
              {f.LastUpdated && (
                <span className="text-xs text-muted-foreground">{formatDate(f.LastUpdated)}</span>
              )}
            </div>
            <p className="leading-relaxed text-foreground/80">{f.Feedback}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

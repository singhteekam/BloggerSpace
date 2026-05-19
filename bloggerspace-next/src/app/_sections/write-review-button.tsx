"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  Star, Loader2, MessageSquarePlus, CheckCircle2,
  Clock, XCircle, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { reviewsApi } from "@/lib/api/reviews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function WriteReviewButton() {
  const { user, isLoading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const { data, isLoading: statusLoading } = useQuery({
    queryKey: ["my-review-status"],
    queryFn: () => reviewsApi.getMyReview().then((r) => r.data),
    enabled: !!user,
  });

  if (authLoading || (user && statusLoading)) {
    return <Skeleton className="mx-auto h-9 w-40 rounded-lg" />;
  }

  // Not logged in
  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <a href="/login">
          <MessageSquarePlus className="size-3.5" />
          Write a review
        </a>
      </Button>
    );
  }

  // Account inactive
  if (user.status && user.status !== "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        <AlertCircle className="size-3" />Account not active — cannot submit reviews
      </span>
    );
  }

  // Not verified
  if (!user.isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        <AlertCircle className="size-3" />Verify your email to write a review
      </span>
    );
  }

  const existing = data?.review;

  // Already submitted — show status badge
  if (existing) {
    if (existing.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400">
          <Clock className="size-3" />Your review is pending approval
        </span>
      );
    }
    if (existing.status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />Your review is live — thank you!
        </span>
      );
    }
    if (existing.status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive">
          <XCircle className="size-3" />Review not approved
          {existing.rejectionReason ? ` — ${existing.rejectionReason}` : ""}
        </span>
      );
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MessageSquarePlus className="size-3.5" />
          Write a review
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <WriteReviewForm onSuccess={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WriteReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create(rating, body),
    onSuccess: () => {
      toast.success("Review submitted! It will appear once approved by our team.");
      onSuccess();
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to submit review.")
          : "Failed to submit review.",
      );
    },
  });

  const canSubmit = rating >= 1 && body.trim().length >= 10 && !mutation.isPending;
  const charsLeft = 1000 - body.length;

  return (
    <>
      <Dialog.Title className="flex items-center gap-2 font-serif text-lg font-semibold">
        <MessageSquarePlus className="size-4 text-primary" />Share your experience
      </Dialog.Title>
      <Dialog.Description className="mt-1 text-sm text-muted-foreground">
        Tell others what you think about BloggerSpace. Your review goes live after admin approval.
      </Dialog.Description>

      <div className="mt-5 space-y-4">
        {/* Star picker */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Your rating</p>
          <div
            className="flex gap-1"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                className="p-0.5 transition-transform hover:scale-110"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={`size-7 transition-colors ${
                    n <= (hovered || rating)
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating === 0 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="size-3" />Click a star to rate
            </p>
          )}
        </div>

        {/* Review body */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Your review</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder="Share your experience writing, reviewing, or reading on BloggerSpace…"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            {body.trim().length > 0 && body.trim().length < 10 && (
              <p className="text-xs text-destructive">At least 10 characters required</p>
            )}
            <p className={`ml-auto text-[11px] ${charsLeft < 100 ? "text-amber-600" : "text-muted-foreground"}`}>
              {charsLeft} left
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Reviews are moderated. Spam or inappropriate content will not be approved.
        </p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Dialog.Close asChild>
          <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
        </Dialog.Close>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!canSubmit}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending
            ? <Loader2 className="size-3.5 animate-spin" />
            : <MessageSquarePlus className="size-3.5" />}
          Submit review
        </Button>
      </div>
    </>
  );
}

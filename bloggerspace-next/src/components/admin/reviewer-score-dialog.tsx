"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Star, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api/admin";
import { useAdminConfig } from "@/hooks/use-admin-config";

/**
 * Phase 6 — admin assigns a quality score to a reviewer for their review of a
 * specific blog. Bounded by AdminConfig.maxBlogScore (default 10). On save,
 * the backend recomputes the reviewer's reviewerScore aggregate (avg + count)
 * from scratch so the public-profile display is always authoritative.
 */
export function ReviewerScoreDialog({
  open,
  setOpen,
  adminId,
  blogId,
  blogTitle,
  reviewerId,
  reviewerName,
  currentScore = null,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  adminId: string;
  blogId: string;
  blogTitle: string;
  reviewerId: string;
  reviewerName: string;
  currentScore?: number | null;
  onSaved?: (newScore: number) => void;
}) {
  const qc = useQueryClient();
  const { data: cfg } = useAdminConfig(adminId);
  const maxScore = cfg?.maxBlogScore ?? 10;

  const [score, setScore] = useState<string>(currentScore != null ? String(currentScore) : "");

  useEffect(() => {
    if (open) setScore(currentScore != null ? String(currentScore) : "");
  }, [open, currentScore]);

  const num = parseInt(score) || 0;
  const outOfRange = score !== "" && (num < 0 || num > maxScore);
  const noChange = score !== "" && num === currentScore;
  const isEmpty = score.trim() === "";

  const mutation = useMutation({
    mutationFn: () => adminApi.setReviewerScore(adminId, blogId, reviewerId, num, ""),
    onSuccess: (data) => {
      toast.success(
        `Review score set to ${data.data.reviewerScore} (reviewer avg: ${data.data.reviewerScoreAvg} from ${data.data.reviewerScoreCount} review${data.data.reviewerScoreCount !== 1 ? "s" : ""}).`,
      );
      onSaved?.(data.data.reviewerScore);
      qc.invalidateQueries({ queryKey: ["admin-user-content"] });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.error ?? "Failed to update reviewer score.")
          : "Failed to update reviewer score.",
      );
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
          <Dialog.Title className="flex items-center gap-2 font-serif text-base font-semibold">
            <Star className="size-4 text-primary" />Reviewer quality score
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground space-y-0.5">
            <span className="block font-medium text-foreground">{reviewerName}</span>
            <span className="block line-clamp-1 italic">&ldquo;{blogTitle}&rdquo;</span>
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="reviewer-score" className="text-sm font-medium">Score</Label>
                <span className="text-xs text-muted-foreground">0–{maxScore}</span>
              </div>
              <Input
                id="reviewer-score"
                type="number"
                min={0}
                max={maxScore}
                value={score}
                placeholder="e.g. 8"
                onChange={(e) => setScore(e.target.value)}
                className={outOfRange ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              {outOfRange && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  Must be between 0 and {maxScore}
                </p>
              )}
            </div>

            <p className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              <MessageSquare className="mt-0.5 size-3 shrink-0" />
              <span>
                The reviewer&apos;s <b>public profile</b> shows an average ★ rating
                computed from all their scored reviews. This score contributes to that average.
              </span>
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={outOfRange || noChange || isEmpty || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Star className="size-3.5" />}
              Save score
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

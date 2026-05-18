"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Star, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api/admin";
import { useAdminConfig } from "@/hooks/use-admin-config";

/**
 * Phase 5 — admin-assigns blog quality score.
 *
 * Score is bounded by AdminConfig.maxBlogScore (default 10). After saving,
 * the backend recomputes the author's creatorScore from scratch (sum of
 * blogScore across all their published blogs) so the cached aggregate
 * always matches reality.
 */
export function BlogScoreDialog({
  open,
  setOpen,
  adminId,
  blogId,
  blogTitle,
  currentScore = 0,
  onSaved,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  adminId: string;
  blogId: string;
  blogTitle: string;
  currentScore?: number;
  /** Called with the new score so the parent can update its local state. */
  onSaved?: (newScore: number) => void;
}) {
  const qc = useQueryClient();
  const { data: cfg } = useAdminConfig(adminId);
  const maxScore = cfg?.maxBlogScore ?? 10;

  const [score, setScore] = useState<string>(String(currentScore));

  // Sync when the dialog reopens against a different blog
  useEffect(() => {
    if (open) setScore(String(currentScore));
  }, [open, currentScore]);

  const num = parseInt(score) || 0;
  const outOfRange = score !== "" && (num < 0 || num > maxScore);
  const noChange = num === currentScore;

  const mutation = useMutation({
    mutationFn: () => adminApi.setBlogScore(adminId, blogId, num),
    onSuccess: (data) => {
      toast.success(`Blog score set to ${data.data.blogScore} (creator total: ${data.data.creatorScore}).`);
      onSaved?.(data.data.blogScore);
      // Invalidate any place that shows this blog or its author's content
      qc.invalidateQueries({ queryKey: ["admin-user-content"] });
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.error ?? "Failed to update score.")
          : "Failed to update score.",
      );
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
          <Dialog.Title className="flex items-center gap-2 font-serif text-base font-semibold">
            <Star className="size-4 text-primary" />Blog quality score
          </Dialog.Title>
          <Dialog.Description className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            &ldquo;{blogTitle}&rdquo;
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="blog-score" className="text-sm font-medium">Score</Label>
                <span className="text-xs text-muted-foreground">0–{maxScore}</span>
              </div>
              <Input
                id="blog-score"
                type="number"
                min={0}
                max={maxScore}
                value={score}
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
              <TrendingUp className="mt-0.5 size-3 shrink-0" />
              <span>
                The author&apos;s <b>creator score</b> updates automatically. It&apos;s the sum
                of all their published blogs&apos; scores and is shown on their public profile.
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
              disabled={outOfRange || noChange || mutation.isPending}
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

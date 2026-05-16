"use client";

import { Gem, User, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface GemsDialogReviewer {
  reviewerId: string;
  reviewerName?: string;
}

export interface GemsDialogAuthor {
  fullName?: string;
  email?: string;
}

export function GemsDialog({
  open,
  setOpen,
  title,
  isEditing,
  authorDetails,
  authorGems,
  setAuthorGems,
  allReviewers,
  reviewerInputs,
  setReviewerInputs,
  loading,
  onSubmit,
  onSkip,
  skipLabel,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  title: string;
  isEditing: boolean;
  authorDetails?: GemsDialogAuthor;
  authorGems: string;
  setAuthorGems: (v: string) => void;
  allReviewers: GemsDialogReviewer[];
  reviewerInputs: Record<string, string>;
  setReviewerInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  onSubmit: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold flex items-center gap-2">
            <Gem className="size-4 text-primary" />
            {isEditing ? "Edit Gems" : "Award Gems"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground line-clamp-2">
            &ldquo;{title}&rdquo;
          </Dialog.Description>

          <div className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {/* Author */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {authorDetails?.fullName ?? "Author"}
                  </p>
                  {authorDetails?.email && (
                    <p className="text-xs text-muted-foreground mt-0.5">{authorDetails.email}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">Author</Badge>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Gems</label>
                <input
                  type="number"
                  min={0}
                  value={authorGems}
                  onChange={(e) => setAuthorGems(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Reviewers */}
            {allReviewers.length > 0 ? (
              <>
                <p className="text-xs font-medium text-muted-foreground pt-1">Reviewers</p>
                {allReviewers.map((r, i) => {
                  const key = r.reviewerId ?? String(i);
                  return (
                    <div
                      key={`${r.reviewerId ?? ""}-${i}`}
                      className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {r.reviewerName ?? `Reviewer ${i + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {r.reviewerId}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">Reviewer</Badge>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Gems</label>
                        <input
                          type="number"
                          min={0}
                          value={reviewerInputs[key] ?? (isEditing ? "0" : "5")}
                          onChange={(e) =>
                            setReviewerInputs((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3 text-center">
                No reviewers assigned — only author gems will be awarded.
              </p>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            {onSkip ? (
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onSkip(); }}>
                {skipLabel ?? "Skip"}
              </Button>
            ) : (
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </Dialog.Close>
            )}
            <Button size="sm" disabled={loading} onClick={onSubmit} className="gap-1.5">
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Gem className="size-3.5" />
              )}
              {isEditing ? "Update gems" : "Award gems"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

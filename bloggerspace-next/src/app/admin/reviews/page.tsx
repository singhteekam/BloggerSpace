"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  MessageSquare, Star, CheckCircle2, XCircle, Clock,
  Loader2, Trash2, AlertCircle,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminReviewsApi, type Review, type ReviewStatus } from "@/lib/api/reviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";
import { UserAvatar } from "@/components/user/user-avatar";

type Tab = ReviewStatus | "all";

export default function AdminReviewsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <ReviewsPanel />;
}

function ReviewsPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");

  const { data: pendingData } = useQuery({
    queryKey: ["admin-reviews-pending-count"],
    queryFn: () => adminReviewsApi.list("pending", 1).then((r) => r.data),
    staleTime: 60_000,
  });
  const pendingCount = pendingData?.total ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageSquare className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Site reviews</h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject user-submitted reviews before they appear on the homepage.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="default" className="shrink-0 gap-1">
            <Clock className="size-3" />{pendingCount} pending
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            <Clock className="mr-1.5 size-3.5" />Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle2 className="mr-1.5 size-3.5" />Approved
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="mr-1.5 size-3.5" />Rejected
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected", "all"] as Tab[]).map((t) => (
          <TabsContent key={t} value={t}>
            <ReviewList status={t} qc={qc} />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

function ReviewList({ status, qc }: { status: Tab; qc: ReturnType<typeof useQueryClient> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: () => adminReviewsApi.list(status, 1).then((r) => r.data),
    staleTime: 60_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["admin-reviews-pending-count"] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminReviewsApi.approve(id),
    onSuccess: () => { toast.success("Review approved — now live on homepage."); invalidate(); },
    onError: (err) => toast.error(isAxiosError(err) ? err.response?.data?.message : "Failed."),
  });

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminReviewsApi.delete(id),
    onSuccess: () => { toast.success("Review deleted."); invalidate(); },
    onError: (err) => toast.error(isAxiosError(err) ? err.response?.data?.message : "Failed."),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  const reviews = data?.reviews ?? [];

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-14 text-center">
        <MessageSquare className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No reviews in this category</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard
            key={r._id}
            review={r}
            onApprove={() => approveMutation.mutate(r._id)}
            onReject={() => setRejectTarget(r._id)}
            onDelete={() => deleteMutation.mutate(r._id)}
            approving={approveMutation.isPending && approveMutation.variables === r._id}
            deleting={deleteMutation.isPending && deleteMutation.variables === r._id}
          />
        ))}
      </div>

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(v) => { if (!v) setRejectTarget(null); }}
        reviewId={rejectTarget}
        onDone={invalidate}
      />
    </>
  );
}

function ReviewCard({
  review, onApprove, onReject, onDelete, approving, deleting,
}: {
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  approving: boolean;
  deleting: boolean;
}) {
  const statusConfig = {
    pending:  { icon: Clock,        cls: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10",   text: "text-amber-700 dark:text-amber-400",   label: "Pending" },
    approved: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10", text: "text-emerald-700 dark:text-emerald-400", label: "Approved" },
    rejected: { icon: XCircle,      cls: "border-destructive/30 bg-destructive/5", text: "text-destructive", label: "Rejected" },
  } as const;
  const s = statusConfig[review.status];
  const StatusIcon = s.icon;

  return (
    <div className={`rounded-xl border p-4 ${s.cls}`}>
      <div className="flex items-start gap-4">
        <UserAvatar src={review.profilePicture} name={review.fullName} size="md" />

        <div className="min-w-0 flex-1">
          {/* Name + meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm">{review.fullName}</span>
            {review.userName && (
              <span className="text-xs text-muted-foreground">@{review.userName}</span>
            )}
            <Badge variant="outline" className={`text-[10px] gap-1 ${s.text}`}>
              <StatusIcon className="size-2.5" />{s.label}
            </Badge>
          </div>

          {/* Stars */}
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3 ${i < review.rating ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40"}`} />
            ))}
          </div>

          {/* Body */}
          <p className="mt-2 text-sm leading-6 text-foreground">{review.body}</p>

          {review.status === "rejected" && review.rejectionReason && (
            <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3 shrink-0" />
              <b>Reason:</b> {review.rejectionReason}
            </p>
          )}

          <p className="mt-1 text-[11px] text-muted-foreground">
            Submitted {formatDate(review.createdAt)}
            {review.approvedAt && <> · Approved {formatDate(review.approvedAt)}</>}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1.5">
          {review.status === "pending" && (
            <>
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={onApprove} disabled={approving}>
                {approving ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Approve
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/5" onClick={onReject}>
                <XCircle className="size-3" />Reject
              </Button>
            </>
          )}
          {review.status === "approved" && (
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/5" onClick={onReject}>
              <XCircle className="size-3" />Reject
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function RejectDialog({
  open, onOpenChange, reviewId, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reviewId: string | null;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => adminReviewsApi.reject(reviewId!, reason),
    onSuccess: () => {
      toast.success("Review rejected.");
      onOpenChange(false);
      setReason("");
      onDone();
    },
    onError: (err) => toast.error(isAxiosError(err) ? err.response?.data?.message : "Failed."),
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">Reject review</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Optionally provide a reason (shown to the user).
          </Dialog.Description>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Optional rejection reason…"
            className="mt-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
              Reject
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PageSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-72" />
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
    </main>
  );
}

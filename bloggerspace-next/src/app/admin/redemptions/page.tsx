"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  Gift, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, Mail,
  IndianRupee, AlertTriangle, ExternalLink, User as UserIcon,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type AdminRedemptionRequest } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";
import Link from "next/link";

type StatusFilter = "PENDING" | "FULFILLED" | "REJECTED";

export default function AdminRedemptionsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <RedemptionsList adminId={user._id} />;
}

function RedemptionsList({ adminId }: { adminId: string }) {
  const [tab, setTab] = useState<StatusFilter>("PENDING");

  // Top-of-page pending count (independent of current tab) for the badge.
  const { data: pendingData } = useQuery({
    queryKey: ["admin-redemptions", adminId, "PENDING", "count"],
    queryFn: () => adminApi.listRedemptions(adminId, 1, "PENDING").then((r) => r.data),
  });
  const pendingCount = pendingData?.pendingCount ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gift className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Redemption requests</h1>
          <p className="text-sm text-muted-foreground">
            Review pending requests and mark them fulfilled after sending the gift card by email.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="default" className="shrink-0 gap-1">
            <Clock className="size-3" />{pendingCount} pending
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusFilter)}>
        <TabsList className="mb-6">
          <TabsTrigger value="PENDING">
            <Clock className="size-3.5 mr-1.5" />Pending
            {pendingCount > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="FULFILLED">
            <CheckCircle2 className="size-3.5 mr-1.5" />Fulfilled
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            <XCircle className="size-3.5 mr-1.5" />Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PENDING"><RequestList adminId={adminId} status="PENDING" /></TabsContent>
        <TabsContent value="FULFILLED"><RequestList adminId={adminId} status="FULFILLED" /></TabsContent>
        <TabsContent value="REJECTED"><RequestList adminId={adminId} status="REJECTED" /></TabsContent>
      </Tabs>
    </main>
  );
}

function RequestList({ adminId, status }: { adminId: string; status: StatusFilter }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-redemptions", adminId, status, page],
    queryFn: () => adminApi.listRedemptions(adminId, page, status).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  const requests = data?.requests ?? [];
  const totalPages = data?.pages ?? 1;

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <Gift className="size-8" />
        <p className="text-sm">No {status.toLowerCase()} requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => <RequestCard key={r._id} adminId={adminId} req={r} />)}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function RequestCard({ adminId, req }: { adminId: string; req: AdminRedemptionRequest }) {
  const user = typeof req.userId === "object" ? req.userId : null;
  const valueRupees = (req.valueInPaise / 100).toFixed(2);

  // Account age in days — useful context for the flag
  const accountAgeDays = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className={`rounded-xl border bg-card p-5 ${req.isFlagged && req.status === "PENDING" ? "border-amber-300 bg-amber-50/40 dark:bg-amber-900/5" : "border-border"}`}>
      {/* Top row: amount + status */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold">{req.gemsAmount} gems</span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-0.5 text-lg font-semibold text-primary">
              <IndianRupee className="size-4" />{valueRupees}
            </span>
            <StatusBadge status={req.status} />
            {req.isFlagged && req.status === "PENDING" && (
              <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-3" />Flagged
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Requested {formatDate(req.createdAt)}
          </p>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <UserIcon className="size-3" />
            <Link href={`/admin/manage/team/${user._id}`} className="font-semibold hover:text-primary">
              {user.fullName}
            </Link>
            <span className="text-muted-foreground">@{user.userName}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Mail className="size-3" />{req.recipientEmail}
          </span>
          <span className="text-muted-foreground">Balance: {user.gems} gems</span>
          {accountAgeDays !== null && (
            <span className="text-muted-foreground">
              Account: {accountAgeDays} day{accountAgeDays === 1 ? "" : "s"} old
            </span>
          )}
          <Link
            href={`/admin/manage/team/${user._id}`}
            className="ml-auto flex items-center gap-0.5 text-primary hover:underline"
          >
            View profile<ExternalLink className="size-2.5" />
          </Link>
        </div>
      )}

      {/* Flag reason */}
      {req.isFlagged && req.flagReason && req.status === "PENDING" && (
        <p className="mt-2 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          <span><b>Flag:</b> {req.flagReason}</span>
        </p>
      )}

      {/* Outcome notes */}
      {req.status === "FULFILLED" && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs dark:border-emerald-900/40 dark:bg-emerald-900/10">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            Fulfilled {req.fulfilledAt ? formatDate(req.fulfilledAt) : ""}
            {req.fulfilledBy && typeof req.fulfilledBy === "object" && ` by ${req.fulfilledBy.fullName ?? req.fulfilledBy.email}`}
          </p>
          {req.fulfillmentNote && <p className="mt-1 italic text-muted-foreground">&ldquo;{req.fulfillmentNote}&rdquo;</p>}
        </div>
      )}
      {req.status === "REJECTED" && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
          <p className="font-medium text-destructive">
            Rejected {req.rejectedAt ? formatDate(req.rejectedAt) : ""}
            {req.rejectedBy && typeof req.rejectedBy === "object" && ` by ${req.rejectedBy.fullName ?? req.rejectedBy.email}`}
          </p>
          {req.rejectionReason && <p className="mt-1 italic text-muted-foreground">&ldquo;{req.rejectionReason}&rdquo;</p>}
          <p className="mt-1 text-muted-foreground">Gems refunded to user&apos;s balance.</p>
        </div>
      )}

      {/* Actions for PENDING */}
      {req.status === "PENDING" && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <RejectButton adminId={adminId} requestId={req._id} />
          <FulfillButton adminId={adminId} requestId={req._id} amount={req.gemsAmount} valueRupees={valueRupees} email={req.recipientEmail} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminRedemptionRequest["status"] }) {
  const map = {
    PENDING:   { v: "secondary" as const, label: "Pending" },
    FULFILLED: { v: "default" as const,   label: "Fulfilled" },
    REJECTED:  { v: "destructive" as const, label: "Rejected" },
  };
  return <Badge variant={map[status].v} className="text-[10px]">{map[status].label}</Badge>;
}

// ─── Fulfill action ──────────────────────────────────────────────────────────
function FulfillButton({
  adminId, requestId, amount, valueRupees, email,
}: { adminId: string; requestId: string; amount: number; valueRupees: string; email: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () => adminApi.fulfillRedemption(adminId, requestId, { note: note.trim() }),
    onSuccess: () => {
      toast.success("Marked as fulfilled. Confirmation email sent to user.");
      setOpen(false);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-redemptions"] });
    },
    onError: (err) =>
      toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error."),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" className="gap-1.5">
          <CheckCircle2 className="size-3.5" />Mark fulfilled
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
          <Dialog.Title className="font-serif text-base font-semibold">Mark as fulfilled?</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">
            Confirm that you&apos;ve sent the ₹{valueRupees} Amazon gift card to <b>{email}</b>. The user will receive a confirmation email.
          </Dialog.Description>
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-medium">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Gift card code: XXXX-YYYY (shown only in your records, NOT emailed to user)"
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">{note.length}/500 characters</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
            </Dialog.Close>
            <Button size="sm" className="gap-1.5" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Confirm — {amount} gems sent
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Reject action ───────────────────────────────────────────────────────────
function RejectButton({ adminId, requestId }: { adminId: string; requestId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => adminApi.rejectRedemption(adminId, requestId, { reason: reason.trim() }),
    onSuccess: () => {
      toast.success("Request rejected. Gems refunded.");
      setOpen(false);
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-redemptions"] });
    },
    onError: (err) =>
      toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error."),
  });

  const tooShort = reason.trim().length < 5;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <XCircle className="size-3.5" />Reject
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
          <Dialog.Title className="font-serif text-base font-semibold">Reject this request?</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">
            Gems will be refunded to the user&apos;s balance and they&apos;ll receive an email with your reason.
          </Dialog.Description>
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-medium">Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Suspicious activity detected on the account"
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {tooShort && (
              <p className="flex items-center gap-1 text-[11px] text-destructive">
                <AlertCircle className="size-2.5" />Please provide at least 5 characters of context.
              </p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              disabled={mutation.isPending || tooShort}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
              Reject &amp; refund
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
      <Skeleton className="h-10 w-72" />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
    </main>
  );
}

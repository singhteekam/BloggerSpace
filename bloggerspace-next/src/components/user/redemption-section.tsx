"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  Gift, Loader2, AlertCircle, CheckCircle2, XCircle, Clock,
  IndianRupee, Sparkles, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { redemptionApi, type RedemptionRequestRecord } from "@/lib/api/user";
import { formatDate } from "@/lib/utils/html";

/**
 * Phase 4 — user-facing redemption section for /myprofile.
 *
 * Renders:
 *  - Current redemption rate + balance preview
 *  - "Redeem" button (disabled if PENDING request exists or cooldown active)
 *  - History list (PENDING / FULFILLED / REJECTED)
 *
 * Critical UX rule (matches backend guarantee): once a request is submitted,
 * gems are immediately deducted from the balance. The user CANNOT submit a
 * second request while one is pending — both the backend (409 response) and
 * the UI (disabled button + tooltip) enforce this.
 */
export function RedemptionSection({ gemsBalance }: { gemsBalance: number }) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["redemption-history"],
    queryFn: () => redemptionApi.listMine(1).then((r) => r.data),
  });

  const requests = data?.requests ?? [];
  const cfg = data?.config;
  const pendingCount = data?.pendingCount ?? 0;
  const cooldownDaysLeft = data?.cooldownDaysLeft ?? 0;

  const rateRupees = cfg ? (cfg.gemValuePaise / 100).toFixed(2) : "—";
  const minGems = cfg?.minRedeemGems ?? 0;
  const maxGems = cfg?.maxRedeemGems ?? 0;

  const hasPending = pendingCount > 0;
  const inCooldown = cooldownDaysLeft > 0;
  const insufficientBalance = gemsBalance < minGems;

  const blockedReason = hasPending
    ? "You already have a pending request"
    : inCooldown
      ? `Cooldown — try again in ${cooldownDaysLeft} day${cooldownDaysLeft === 1 ? "" : "s"}`
      : insufficientBalance
        ? `Minimum ${minGems} gems required`
        : "";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gift className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Redeem gems for gift cards</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cfg
                ? <>Convert your gems into Amazon gift cards. <b>{minGems}</b> gem{minGems === 1 ? "" : "s"} = <b>₹{((minGems * cfg.gemValuePaise) / 100).toFixed(2)}</b></>
                : "Loading rate…"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setDialogOpen(true)}
          disabled={!cfg || hasPending || inCooldown || insufficientBalance}
          title={blockedReason || undefined}
        >
          <Sparkles className="size-3.5" />Redeem
        </Button>
      </div>

      {/* Blocked-state hint (when button disabled) */}
      {(hasPending || inCooldown || insufficientBalance) && cfg && (
        <div className="flex items-center gap-2 border-b border-border bg-amber-50 px-5 py-2.5 text-xs text-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{blockedReason}</span>
        </div>
      )}

      {/* History */}
      <div className="px-5 py-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <History className="size-3" />Redemption history
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No redemption requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => <RedemptionRow key={r._id} req={r} />)}
          </div>
        )}
      </div>

      {/* Dialog */}
      {cfg && (
        <RedeemDialog
          open={dialogOpen}
          setOpen={setDialogOpen}
          gemsBalance={gemsBalance}
          minGems={minGems}
          maxGems={Math.min(maxGems, gemsBalance)}
          gemValuePaise={cfg.gemValuePaise}
          rateRupees={rateRupees}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["redemption-history"] });
            qc.invalidateQueries({ queryKey: ["userinfo"] });
          }}
        />
      )}
    </div>
  );
}

// ─── Per-row in history ─────────────────────────────────────────────────────
function RedemptionRow({ req }: { req: RedemptionRequestRecord }) {
  const valueRupees = (req.valueInPaise / 100).toFixed(2);

  const statusConfig = {
    PENDING:   { icon: Clock,        cls: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10",   text: "text-amber-700 dark:text-amber-400", label: "Pending review" },
    FULFILLED: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10", text: "text-emerald-700 dark:text-emerald-400", label: "Fulfilled" },
    REJECTED:  { icon: XCircle,      cls: "border-destructive/30 bg-destructive/5", text: "text-destructive", label: "Rejected — gems refunded" },
  } as const;
  const s = statusConfig[req.status];
  const Icon = s.icon;

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${s.cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {req.gemsAmount} gems → ₹{valueRupees}
            </span>
            <Badge variant="outline" className={`text-[10px] gap-1 ${s.text}`}>
              <Icon className="size-2.5" />{s.label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            To: <span className="font-medium">{req.recipientEmail}</span>
            &nbsp;·&nbsp;Requested {formatDate(req.createdAt)}
          </p>
          {req.status === "FULFILLED" && req.fulfillmentNote && (
            <p className="text-[11px] italic text-muted-foreground break-words">
              &ldquo;{req.fulfillmentNote}&rdquo;
            </p>
          )}
          {req.status === "REJECTED" && req.rejectionReason && (
            <p className="text-[11px] italic text-muted-foreground break-words">
              <b>Reason:</b> {req.rejectionReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Redeem confirmation dialog ──────────────────────────────────────────────
function RedeemDialog({
  open,
  setOpen,
  gemsBalance,
  minGems,
  maxGems,
  gemValuePaise,
  rateRupees,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  gemsBalance: number;
  minGems: number;
  maxGems: number;  // already capped to user balance
  gemValuePaise: number;
  rateRupees: string;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState<string>("");

  // Reset when reopened
  useEffect(() => {
    if (open) setAmount(String(Math.min(maxGems, Math.max(minGems, gemsBalance))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const numAmount = parseInt(amount) || 0;
  const outOfRange = amount !== "" && (numAmount < minGems || numAmount > maxGems);
  const previewRupees = ((numAmount * gemValuePaise) / 100).toFixed(2);
  const canSubmit = !outOfRange && numAmount >= minGems && numAmount <= maxGems;

  const mutation = useMutation({
    mutationFn: () => redemptionApi.create(numAmount),
    onSuccess: () => {
      toast.success(`Submitted! ${numAmount} gems → ₹${previewRupees}`);
      setOpen(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.error ?? "Failed to submit request.")
          : "Failed to submit request.",
      );
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Gift className="size-4 text-primary" />Redeem gems
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Submit a request to convert your gems into an Amazon gift card.
            Admin will review and email it to you.
          </Dialog.Description>

          <div className="mt-5 space-y-4">
            {/* Rate banner */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Conversion rate</span>
              <span className="flex items-center gap-1 font-semibold">
                <IndianRupee className="size-3" />{rateRupees} per gem
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="redeem-amount" className="text-sm font-medium">Amount (gems)</Label>
                <span className="text-xs text-muted-foreground">
                  Allowed: {minGems}–{maxGems}
                </span>
              </div>
              <Input
                id="redeem-amount"
                type="number"
                min={minGems}
                max={maxGems}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={outOfRange ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Your balance: <b>{gemsBalance}</b> gems
              </p>
              {outOfRange && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  Must be between {minGems} and {maxGems} gems
                </p>
              )}
            </div>

            {/* Live preview */}
            {!outOfRange && numAmount > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <p className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">You&apos;ll receive</span>
                  <b className="text-emerald-700 dark:text-emerald-400">₹{previewRupees}</b>
                </p>
                <p className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Balance after</span>
                  <span className="font-medium">{gemsBalance - numAmount} gems</span>
                </p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              By submitting, your gems will be deducted immediately. They&apos;ll be
              refunded if your request is rejected.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
            </Dialog.Close>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!canSubmit || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Gift className="size-3.5" />}
              Submit request
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

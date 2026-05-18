"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Gem, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api/admin";
import { useAdminConfig } from "@/hooks/use-admin-config";

/**
 * Phase 3 — admin-initiated gem grant dialog.
 * Validates amount falls in [minGrantGems, maxGrantGems] (from AdminConfig),
 * requires a non-empty appreciation note, and triggers a backend email on success.
 */
export function GrantGemsDialog({
  open,
  setOpen,
  adminId,
  targetUserId,
  targetUserName,
  onGranted,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  adminId: string;
  targetUserId: string;
  targetUserName?: string;
  /** Called after a successful grant. Useful to refresh balance / history. */
  onGranted?: () => void;
}) {
  const qc = useQueryClient();
  const { data: cfg } = useAdminConfig(adminId);
  const minGrant = cfg?.minGrantGems ?? 0;
  const maxGrant = cfg?.maxGrantGems ?? 100;

  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Reset state when dialog reopens
  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
    }
  }, [open]);

  const numAmount = parseInt(amount) || 0;
  const amountOutOfRange = amount !== "" && (numAmount < minGrant || numAmount > maxGrant);
  const noteEmpty = note.trim().length === 0;
  const canSubmit = !amountOutOfRange && !noteEmpty && numAmount > 0;

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.grantGems(adminId, targetUserId, { amount: numAmount, note: note.trim() }),
    onSuccess: () => {
      toast.success(`Granted ${numAmount} gems${targetUserName ? ` to ${targetUserName}` : ""}.`);
      qc.invalidateQueries({ queryKey: ["admin-gem-grants", targetUserId] });
      qc.invalidateQueries({ queryKey: ["user-content", targetUserId] });
      setOpen(false);
      onGranted?.();
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.error ?? err.response?.data?.message ?? "Failed to grant gems.")
          : "Failed to grant gems.",
      );
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Sparkles className="size-4 text-primary" />
            Grant gems
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Award gems to <b>{targetUserName ?? "this user"}</b> with an appreciation note. An email will be sent automatically.
          </Dialog.Description>

          <div className="mt-5 space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="grant-amount" className="text-sm font-medium">Amount (gems)</Label>
                <span className="text-xs text-muted-foreground">
                  Allowed: {minGrant}–{maxGrant}
                </span>
              </div>
              <Input
                id="grant-amount"
                type="number"
                min={minGrant}
                max={maxGrant}
                placeholder={`e.g. ${minGrant}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={amountOutOfRange ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              {amountOutOfRange && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  Must be between {minGrant} and {maxGrant} gems
                </p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="grant-note" className="text-sm font-medium">Appreciation note</Label>
              <Textarea
                id="grant-note"
                placeholder="Why are you awarding these gems? This message will be emailed to the user."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{note.length}/500 characters</p>
            </div>
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
              {mutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Gem className="size-3.5" />
              )}
              Grant {numAmount > 0 ? `${numAmount} gems` : "gems"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

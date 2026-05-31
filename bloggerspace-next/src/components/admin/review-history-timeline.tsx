"use client";

import { useState } from "react";
import { History, ChevronDown, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReviewHistoryEntry } from "@/lib/api/admin";

const IST = "Asia/Kolkata";

function fmtDate(ts: string | null) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("en-IN", {
      timeZone: IST, day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return "—";
  }
}

// Map raw status tokens (e.g. "UNDERREVIEW-INREVIEW") to a readable arrow label.
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PENDINGREVIEW: "Pending review",
  UNDERREVIEW: "Under review",
  INREVIEW: "In review",
  AWAITING: "Awaiting author",
  AWAITINGAUTHOR: "Awaiting author",
  DISCARD: "Discarded",
  DISCARDQUEUE: "Discard queue",
  PUBLISHED: "Published",
  ADMINPUBLISHED: "Published",
};

function formatAction(action: string) {
  if (!action) return "Reviewed";
  return action
    .split("-")
    .map((tok) => STATUS_LABELS[tok.toUpperCase().replace(/_/g, "")] ?? tok)
    .join(" → ");
}

export function ReviewHistoryTimeline({ entries }: { entries: ReviewHistoryEntry[] }) {
  const [open, setOpen] = useState(false);

  if (!entries || entries.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Review history</span>
          <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
        </span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4">
          <ol className="relative space-y-4 border-l border-border pl-5">
            {entries.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 flex size-4 items-center justify-center rounded-full border border-border bg-card">
                  <span className="size-1.5 rounded-full bg-primary/70" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <User className="size-3.5 text-muted-foreground" />
                    {e.reviewerName}
                  </span>
                  {e.role && (
                    <Badge variant="outline" className="text-[10px] capitalize">{e.role}</Badge>
                  )}
                  {e.rating != null && e.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-500">
                      <Star className="size-3 fill-current" />{e.rating}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs font-medium text-foreground">{formatAction(e.action)}</p>
                <p className="text-[11px] text-muted-foreground">{fmtDate(e.date)}</p>
                {e.remarks && (
                  <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                    {e.remarks}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

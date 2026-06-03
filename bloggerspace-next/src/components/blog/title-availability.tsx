"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { blogWriteApi } from "@/lib/api/blog-write";

// Live title-availability indicator (debounced) — mirrors the new-blog editor.
// Pass `excludeId` (the blog being edited) so the blog's OWN unchanged title
// reads as "Available" rather than "Already taken".
export function TitleAvailability({ title, excludeId }: { title: string; excludeId?: string }) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    const t = (title ?? "").trim();
    if (t.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await blogWriteApi.checkTitle(t, excludeId);
        setStatus(res.data.message === "Available" ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [title, excludeId]);

  if (status === "idle") return null;
  if (status === "checking")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Checking…
      </span>
    );
  if (status === "available")
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Available
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <XCircle className="size-3" /> Already taken
    </span>
  );
}

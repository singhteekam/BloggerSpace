"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { blogWriteApi } from "@/lib/api/blog-write";

// Live SLUG-availability indicator (debounced). The slug — not the title — is the
// unique key (/blogs/:slug), and two different titles can collapse to the same
// slug (e.g. "Foo" vs "Foo."), so we validate the slug. Pass `excludeId` (the blog
// being edited) so the blog's OWN slug reads as available rather than "taken".
export function SlugAvailability({ slug, excludeId }: { slug: string; excludeId?: string }) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    const s = (slug ?? "").trim();
    if (s.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await blogWriteApi.checkSlug(s, excludeId);
        setStatus(res.data.message === "Available" ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [slug, excludeId]);

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

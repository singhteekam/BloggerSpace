"use client";

import { useEffect } from "react";
import { authStorage } from "@/lib/api/auth-storage";
import { userApi } from "@/lib/api/user";

type Props = {
  slug: string;
  blogId?: number;
  title?: string;
  category?: string;
};

export function BlogViewTracker({ slug, blogId, title, category }: Props) {
  useEffect(() => {
    // Note: the per-session view increment now lives in <LiveViewCount> (so it can
    // render the fresh total). This component only records reading history.

    // Record reading history for logged-in users only (auth-gated to avoid 401s).
    const histKey = `bs_history_${slug}`;
    if (authStorage.getToken() && title && !sessionStorage.getItem(histKey)) {
      sessionStorage.setItem(histKey, "1");
      userApi
        .addReadingHistory({ blogId, slug, title, category: category ?? "" })
        .catch(() => {});
    }
  }, [slug, blogId, title, category]);

  return null;
}

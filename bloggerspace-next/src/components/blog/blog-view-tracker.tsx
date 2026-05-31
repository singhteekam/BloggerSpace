"use client";

import { useEffect } from "react";
import { api } from "@/lib/api/client";
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
    const key = `bs_viewed_${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      api.patch("/api/blogs/updateblogviews", { blogSlug: slug }).catch(() => {});
    }

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

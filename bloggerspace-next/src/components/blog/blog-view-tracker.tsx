"use client";

import { useEffect } from "react";
import { api } from "@/lib/api/client";

export function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `bs_viewed_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    api.patch("/api/blogs/updateblogviews", { blogSlug: slug }).catch(() => {});
  }, [slug]);

  return null;
}

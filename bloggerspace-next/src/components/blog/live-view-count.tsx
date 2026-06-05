"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

/**
 * Renders an always-fresh view count on the (ISR-cached, days-long) blog page.
 * The server-rendered number can be stale, so on mount this:
 *   - first view this session → increments and shows the returned fresh total;
 *   - otherwise → reads the current total (no increment).
 * Both hit the backend only, so this adds NO Vercel ISR Writes / Fast Origin Transfer.
 * Owns the per-session increment (the BlogViewTracker no longer does it).
 */
export function LiveViewCount({ slug, initial }: { slug: string; initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const key = `bs_viewed_${slug}`;
    const path = `/api/blogs/${encodeURIComponent(slug)}/views`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      api
        .patch<{ totalViews: number }>("/api/blogs/updateblogviews", { blogSlug: slug })
        .then((r) => {
          if (typeof r.data?.totalViews === "number") setCount(r.data.totalViews);
        })
        .catch(() => {});
    } else {
      api
        .get<{ blogViews: number }>(path)
        .then((r) => {
          if (typeof r.data?.blogViews === "number") setCount(r.data.blogViews);
        })
        .catch(() => {});
    }
  }, [slug]);

  return <>{count.toLocaleString()} views</>;
}

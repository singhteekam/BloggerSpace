"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analyticsApi } from "@/lib/api/analytics";

export function TrackPageView() {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const referrer = typeof document !== "undefined" ? document.referrer : "";
    analyticsApi.track(pathname, referrer).catch(() => {});
  }, [pathname]);

  return null;
}

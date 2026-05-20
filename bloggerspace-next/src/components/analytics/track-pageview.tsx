"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analyticsApi } from "@/lib/api/analytics";

const VISITOR_KEY = "bs.vid";

function getOrCreateVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    // Generate a random UUID-like ID without crypto dependency
    const id = "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return "";
  }
}

export function TrackPageView() {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const visitorId = getOrCreateVisitorId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    analyticsApi.track(pathname, referrer, visitorId).catch(() => {});
  }, [pathname]);

  return null;
}

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
  // null = not yet resolved; cached for the session after the first check.
  const enabledRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const visitorId = getOrCreateVisitorId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    (async () => {
      // Resolve the admin master switch once per session, then cache it. When
      // analytics is off we skip the request entirely. (The backend also guards,
      // so even cached sessions stop being recorded within ~30s of a toggle.)
      if (enabledRef.current === null) {
        try {
          const res = await analyticsApi.getConfig();
          enabledRef.current = res.data.enabled;
        } catch {
          enabledRef.current = true; // default to tracking if the check fails
        }
      }
      if (!enabledRef.current) return;
      analyticsApi.track(pathname, referrer, visitorId).catch(() => {});
    })();
  }, [pathname]);

  return null;
}

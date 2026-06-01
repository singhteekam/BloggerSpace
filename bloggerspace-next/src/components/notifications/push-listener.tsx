"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { onForegroundMessage } from "@/lib/firebase/messaging";

// Shows a toast when a push notification arrives while the site tab is focused
// (background notifications are handled by the service worker). No-ops cleanly
// when push isn't configured/supported.
export function PushListener() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    onForegroundMessage((title, body, link) => {
      toast(title, {
        description: body,
        action: link
          ? { label: "View", onClick: () => window.open(link, "_blank", "noopener,noreferrer") }
          : undefined,
      });
    }).then((unsub) => {
      cleanup = unsub;
    });
    return () => cleanup?.();
  }, []);

  return null;
}

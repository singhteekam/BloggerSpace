"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
import { interactionCache } from "@/lib/api/interaction-cache";
import { isPushConfigured, requestPushToken } from "@/lib/firebase/messaging";

export function PushNotificationToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);

  // On mount: seed the toggle INSTANTLY from the last-known state for this
  // device (localStorage, no flash), then reconcile with the live backend
  // status so it reflects the real subscription state.
  useEffect(() => {
    if (!user) return;
    const supported =
      typeof window !== "undefined" && "Notification" in window && isPushConfigured();
    setAvailable(supported);
    if (!supported) return;

    const cached = interactionCache.getPushEnabled(user._id);
    if (cached !== undefined) setEnabled(cached);

    (async () => {
      // No browser permission → this device cannot be subscribed.
      if (Notification.permission !== "granted") {
        setEnabled(false);
        interactionCache.setPushEnabled(user._id, false);
        return;
      }
      const t = await requestPushToken();
      if (!t) return;
      setToken(t);
      try {
        const res = await userApi.getPushStatus(t);
        setEnabled(res.data.enabled);
        interactionCache.setPushEnabled(user._id, res.data.enabled);
      } catch {
        /* keep the cached value on failure */
      }
    })();
  }, [user]);

  if (!user) return null;

  const toggle = async () => {
    if (loading) return;
    const next = !enabled;
    setEnabled(next); // optimistic — flip instantly, revert below if it fails
    setLoading(true);
    try {
      if (next) {
        const t = token ?? (await requestPushToken());
        if (!t) {
          setEnabled(false);
          toast.error("Notifications are blocked. Enable them in your browser settings.");
          return;
        }
        setToken(t);
        await userApi.registerPushToken(t, navigator.userAgent);
        toast.success("Push notifications enabled.");
      } else {
        if (token) await userApi.unregisterPushToken(token);
        toast.success("Push notifications disabled.");
      }
      interactionCache.setPushEnabled(user._id, next); // persist new state
    } catch {
      setEnabled(!next); // revert on failure
      toast.error("Couldn't update push notifications. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Push notifications</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {available
                ? "Get a browser notification when fresh trending blogs are published. Opt out anytime."
                : "Push notifications aren’t available in this browser."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={!available}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

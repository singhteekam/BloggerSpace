"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
import { isPushConfigured, requestPushToken } from "@/lib/firebase/messaging";
import { Button } from "@/components/ui/button";

// Homepage banner nudging logged-in users to turn on trending-blog push
// notifications. Renders nothing unless: the user is signed in, push is
// configured + supported in this browser, notifications aren't blocked, and the
// user is NOT already subscribed on this device.
export function PushCtaSection() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supported =
      typeof window !== "undefined" && "Notification" in window && isPushConfigured();
    if (!supported || Notification.permission === "denied") return;

    // If permission is already granted, only show when they aren't subscribed yet.
    (async () => {
      if (Notification.permission === "granted") {
        const t = await requestPushToken();
        if (t) {
          try {
            const res = await userApi.getPushStatus(t);
            if (res.data.enabled) return; // already subscribed → don't nag
          } catch {
            /* fall through to show */
          }
        }
      }
      setShow(true);
    })();
  }, [user]);

  if (!user || !show) return null;

  const subscribe = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await requestPushToken();
      if (!token) {
        toast.error("Allow notifications in your browser to subscribe.");
        return;
      }
      await userApi.registerPushToken(token, navigator.userAgent);
      toast.success("You're subscribed! We'll notify you about trending blogs.");
      setShow(false);
    } catch {
      toast.error("Couldn't enable notifications. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="size-5" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-tight">
                Never miss a trending read
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get a browser notification when fresh, trending blogs go live. No spam — opt out
                anytime from settings.
              </p>
            </div>
          </div>
          <Button onClick={subscribe} disabled={loading} className="shrink-0 gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Enable notifications
          </Button>
        </div>
      </div>
    </section>
  );
}

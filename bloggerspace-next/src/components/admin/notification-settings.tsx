"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Bell, Loader2, Save, Send, Users } from "lucide-react";
import { adminApi, type NotificationConfig } from "@/lib/api/admin";
import { isPushConfigured, requestPushToken } from "@/lib/firebase/messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const FREQUENCIES = [3, 7, 14];

export function NotificationSettings({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Partial<NotificationConfig> | null>(null);
  const [testing, setTesting] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-notification-config", adminId],
    queryFn: () => adminApi.getNotificationConfig(adminId).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: Partial<NotificationConfig>) =>
      adminApi.updateNotificationConfig(adminId, body).then((r) => r.data),
    onSuccess: (next) => {
      qc.setQueryData(["admin-notification-config", adminId], (prev: NotificationConfig | undefined) =>
        prev ? { ...prev, ...next } : prev,
      );
      setDraft(null);
      toast.success("Notification settings saved.");
    },
    onError: (err) =>
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Save failed.") : "Save failed."),
  });

  const runMutation = useMutation({
    mutationFn: () => adminApi.runNotificationCycle(adminId).then((r) => r.data),
    onSuccess: (res) => {
      if (res.ran) toast.success(`Digest sent: ${res.blogs} blog(s) to ${res.recipients} subscriber(s).`);
      else toast.info(`Nothing sent — ${res.reason?.replace(/-/g, " ") ?? "not due"}.`);
      qc.invalidateQueries({ queryKey: ["admin-notification-config", adminId] });
    },
    onError: () => toast.error("Failed to run notification cycle."),
  });

  if (isLoading || !config) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  // Merge saved config with the in-progress draft.
  const v = { ...config, ...draft };
  const dirty = draft !== null;
  const set = (patch: Partial<NotificationConfig>) => setDraft((d) => ({ ...(d ?? {}), ...patch }));

  const handleSave = () => {
    if (!draft) return;
    saveMutation.mutate({
      notificationsEnabled: v.notificationsEnabled,
      notificationFrequencyDays: v.notificationFrequencyDays,
      trendingBlogCount: v.trendingBlogCount,
    });
  };

  const handleTest = async () => {
    if (!isPushConfigured()) {
      toast.error("Firebase push is not configured (missing env keys).");
      return;
    }
    setTesting(true);
    try {
      const token = await requestPushToken();
      if (!token) {
        toast.error("Allow notifications in your browser to send a test.");
        return;
      }
      await adminApi.sendTestNotification(adminId, token);
      toast.success("Test notification sent to this browser.");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Test failed.") : "Test failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Bell className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">Push notifications</h2>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {config.subscriberCount} subscriber{config.subscriberCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {/* Enable toggle */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Trending-blog digest</p>
            <p className="text-xs text-muted-foreground">
              Sends a single digest of the top trending blogs to opted-in users, no more than once per cycle.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={v.notificationsEnabled}
            onClick={() => set({ notificationsEnabled: !v.notificationsEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              v.notificationsEnabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                v.notificationsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
            <select
              value={v.notificationFrequencyDays}
              onChange={(e) => set({ notificationFrequencyDays: Number(e.target.value) })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>Every {f} days</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">Minimum gap between digests.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Trending blogs per digest</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={v.trendingBlogCount}
              onChange={(e) => set({ trendingBlogCount: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground">Most-viewed recent posts not sent before (1–10).</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Last digest sent:{" "}
          {config.lastNotificationSentAt
            ? new Date(config.lastNotificationSentAt).toLocaleString()
            : "never"}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing} className="gap-1.5">
              {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
              Send test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || !config.notificationsEnabled}
              className="gap-1.5"
              title={config.notificationsEnabled ? "Send a digest now (respects dedup)" : "Enable notifications first"}
            >
              {runMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Run now
            </Button>
          </div>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saveMutation.isPending} className="gap-1.5">
            {saveMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

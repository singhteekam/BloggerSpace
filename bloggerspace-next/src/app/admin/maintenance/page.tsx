"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Wrench, AlertTriangle, CheckCircle2, Loader2, Globe, ShieldOff } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminConfigApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMaintenancePage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <MaintenanceDashboard adminId={user._id} />;
}

function MaintenanceDashboard({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-config", adminId],
    queryFn: () => adminConfigApi.get(adminId).then((r) => r.data),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (value: boolean) =>
      adminConfigApi.update(adminId, { maintenanceMode: value }),
    onSuccess: (_, value) => {
      toast.success(value ? "Maintenance mode enabled." : "Site is live again.");
      qc.invalidateQueries({ queryKey: ["admin-config", adminId] });
    },
    onError: (err) =>
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const isOn = config?.maintenanceMode ?? false;

  function requestToggle(to: boolean) {
    setPendingValue(to);
    setConfirmOpen(true);
  }

  function confirmToggle() {
    mutation.mutate(pendingValue);
    setConfirmOpen(false);
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wrench className="size-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Maintenance Mode</h1>
          <p className="text-sm text-muted-foreground">
            Block all public pages and show a maintenance screen to visitors
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isOn ? (
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
                <ShieldOff className="size-5 text-amber-500" />
              </div>
            ) : (
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Globe className="size-5 text-emerald-500" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">
                {isOn ? "Maintenance mode is ON" : "Site is live"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOn
                  ? "All public pages are blocked. Only the admin panel is accessible."
                  : "All pages are publicly accessible."}
              </p>
            </div>
          </div>

          {/* Toggle button */}
          <Button
            variant={isOn ? "default" : "destructive"}
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={mutation.isPending}
            onClick={() => requestToggle(!isOn)}
          >
            {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {isOn ? "Disable" : "Enable"}
          </Button>
        </div>

        {/* Visual toggle indicator */}
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <div className={`size-2.5 rounded-full ${isOn ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
          <p className="text-xs text-muted-foreground">
            Status updates within <span className="font-medium text-foreground">30 seconds</span> across all visitors
            (middleware cache TTL)
          </p>
        </div>
      </div>

      {/* What happens section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-4 text-sm font-semibold text-foreground">What maintenance mode does</p>
        <div className="space-y-3">
          {[
            {
              icon: <ShieldOff className="size-4 text-destructive" />,
              label: "All public pages blocked",
              desc: "Home, blogs, community, profiles — all redirect to the maintenance page.",
            },
            {
              icon: <CheckCircle2 className="size-4 text-emerald-500" />,
              label: "Admin panel stays accessible",
              desc: "/admin/* routes and the admin login page remain fully functional.",
            },
            {
              icon: <CheckCircle2 className="size-4 text-emerald-500" />,
              label: "Reviewer panel blocked",
              desc: "/reviewer/* routes are also blocked during maintenance.",
            },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
            <Dialog.Title className="font-serif text-lg font-semibold">
              {pendingValue ? "Enable maintenance mode?" : "Disable maintenance mode?"}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {pendingValue
                ? "All visitors will immediately see the maintenance page. Only the admin panel will be accessible. The change takes effect within 30 seconds."
                : "The site will become publicly accessible again within 30 seconds."}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button
                variant={pendingValue ? "destructive" : "default"}
                size="sm"
                onClick={confirmToggle}
                className="gap-1.5"
              >
                {pendingValue ? (
                  <><ShieldOff className="size-3.5" />Enable maintenance</>
                ) : (
                  <><Globe className="size-3.5" />Bring site live</>
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

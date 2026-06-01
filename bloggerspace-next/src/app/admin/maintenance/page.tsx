"use client";

import { Wrench, ShieldOff, CheckCircle2, Terminal } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMaintenancePage() {
  const { user, isLoading } = useRequireAdmin();
  if (isLoading) return <PageSkeleton />;
  if (!user) return null;

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

      {/* How to control it */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Terminal className="size-4 text-primary" />
          Controlled by an environment variable
        </p>
        <p className="text-sm text-muted-foreground">
          Maintenance mode is now toggled from your hosting (Vercel) environment variables — not
          from this panel — so the site never has to poll the backend for it.
        </p>
        <div className="mt-4 space-y-2">
          <div className="rounded-lg bg-muted/60 px-4 py-3 font-mono text-xs">
            MAINTENANCE_MODE = <span className="text-amber-500">true</span>
            <span className="ml-2 text-muted-foreground">→ site is down for maintenance</span>
          </div>
          <div className="rounded-lg bg-muted/60 px-4 py-3 font-mono text-xs">
            MAINTENANCE_MODE = <span className="text-emerald-500">false</span>
            <span className="ml-2 text-muted-foreground">→ site is live (or leave it unset)</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          After changing the variable in Vercel, redeploy (or it applies on the next deployment) for
          it to take effect.
        </p>
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
              label: "The /maintenance page is hidden when live",
              desc: "Visiting it directly while the site is live redirects back to the homepage.",
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

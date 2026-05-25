"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart2, Monitor, Smartphone, Tablet, RefreshCw, Link2, Clock, Eye, Users } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { analyticsApi, type AnalyticsData, type TimelinePoint } from "@/lib/api/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <AnalyticsSkeleton />;
  if (!user) return null;
  return <AnalyticsDashboard userId={user._id} />;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function TimelineChart({ data, mode }: { data: TimelinePoint[]; mode: "views" | "visitors" }) {
  const vals = data.map((d) => (mode === "views" ? d.views : d.visitors));
  const max = Math.max(...vals, 1);
  const W = 700; const H = 100;
  const barW = Math.floor(W / data.length) - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" aria-label="30-day timeline">
      {data.map((d, i) => {
        const val = mode === "views" ? d.views : d.visitors;
        const barH = Math.max(2, (val / max) * H);
        return (
          <g key={d.date}>
            <rect x={i * (barW + 1)} y={H - barH} width={barW} height={barH} rx={2}
              className={i === data.length - 1 ? "fill-primary" : "fill-primary/40"} />
            <title>{`${d.date}: ${val} ${mode}`}</title>
          </g>
        );
      })}
      {data.map((d, i) => {
        if (i % 7 !== 0 && i !== data.length - 1) return null;
        return (
          <text key={`lbl-${i}`} x={i * (barW + 1) + barW / 2} y={H + 16}
            textAnchor="middle" fontSize={9} className="fill-muted-foreground">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── SVG Hourly heatmap ────────────────────────────────────────────────────────
function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 700; const H = 60;
  const barW = Math.floor(W / 24) - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" aria-label="Traffic by hour">
      {data.map((d) => {
        const barH = Math.max(2, (d.count / max) * H);
        return (
          <g key={d.hour}>
            <rect x={d.hour * (barW + 1)} y={H - barH} width={barW} height={barH} rx={2}
              className={d.count === max ? "fill-emerald-500" : "fill-emerald-500/40"} />
            <title>{`${String(d.hour).padStart(2, "0")}:00 — ${d.count} visits`}</title>
          </g>
        );
      })}
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={h * (barW + 1) + barW / 2} y={H + 14}
          textAnchor="middle" fontSize={9} className="fill-muted-foreground">
          {`${String(h).padStart(2, "0")}h`}
        </text>
      ))}
    </svg>
  );
}

function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function AnalyticsDashboard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [timelineMode, setTimelineMode] = useState<"views" | "visitors">("views");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", userId],
    queryFn: () => analyticsApi.getStats(userId).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) return <AnalyticsSkeleton />;

  const { summary, pages, devices, referrers, hours, timeline } = data as AnalyticsData;
  const totalViews    = summary.totalViews;
  const topPageCount  = pages[0]?.count ?? 1;
  const topRefCount   = referrers[0]?.count ?? 1;
  const totalDevices  = devices.reduce((s, d) => s + d.count, 0) || 1;

  const deviceMap = Object.fromEntries(devices.map((d) => [d.device, d.count]));
  const desktop = deviceMap["desktop"] ?? 0;
  const mobile  = deviceMap["mobile"]  ?? 0;
  const tablet  = deviceMap["tablet"]  ?? 0;

  const peakHour = hours.reduce((best, h) => (h.count > best.count ? h : best), { hour: 0, count: 0 });

  const summaryCards = [
    { period: "Today",      views: summary.todayViews,  unique: summary.todayUnique },
    { period: "This Week",  views: summary.weekViews,   unique: summary.weekUnique },
    { period: "This Month", views: summary.monthViews,  unique: summary.monthUnique },
    { period: "All Time",   views: summary.totalViews,  unique: summary.totalUnique },
  ];

  const colors = ["text-sky-500", "text-emerald-500", "text-violet-500", "text-amber-500"];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart2 className="size-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">Visitor insights &amp; traffic overview</p>
          </div>
        </div>
        <Button variant="outline" size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-analytics"] })}
          className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary cards — views + unique visitors side by side */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((s, i) => (
          <div key={s.period} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">{s.period}</p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className={`text-xl font-bold ${colors[i]}`}>{s.views.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <Eye className="size-2.5" />Views
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${colors[i]}/70`}>{s.unique.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5 justify-end">
                  <Users className="size-2.5" />Unique
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 30-day timeline with toggle */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Last 30 Days</p>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs">
            <button
              onClick={() => setTimelineMode("views")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${timelineMode === "views" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Views
            </button>
            <button
              onClick={() => setTimelineMode("visitors")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${timelineMode === "visitors" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Unique
            </button>
          </div>
        </div>
        {timeline.some((d) => d.views > 0) ? (
          <TimelineChart data={timeline} mode={timelineMode} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
        )}
      </div>

      {/* Hourly heatmap */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-emerald-500" />
            <p className="text-sm font-semibold text-foreground">Traffic by Hour</p>
          </div>
          {peakHour.count > 0 && (
            <p className="text-xs text-muted-foreground">
              Peak: <span className="font-medium text-foreground">
                {String(peakHour.hour).padStart(2, "0")}:00–{String((peakHour.hour + 1) % 24).padStart(2, "0")}:00 UTC
              </span>
            </p>
          )}
        </div>
        {hours.some((h) => h.count > 0) ? (
          <HourlyChart data={hours} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
        )}
      </div>

      {/* Top Pages + Top Referrers */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="size-4 text-violet-500" />
            <p className="text-sm font-semibold text-foreground">Top Pages</p>
          </div>
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {pages.map((p) => (
                <div key={p.page}>
                  <div className="mb-1 flex min-w-0 items-center gap-2 text-xs">
                    <span className="flex-1 min-w-0 truncate font-medium text-foreground" title={p.page}>
                      {p.page}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {p.count.toLocaleString()}
                      <span className="ml-1 text-[10px]">({Math.round((p.count / (totalViews || 1)) * 100)}%)</span>
                    </span>
                  </div>
                  <MiniBar pct={(p.count / topPageCount) * 100} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="size-4 text-sky-500" />
            <p className="text-sm font-semibold text-foreground">Top Referrers</p>
          </div>
          {referrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No referrer data yet — direct/bookmark traffic has no referrer.
            </p>
          ) : (
            <div className="space-y-3">
              {referrers.map((r) => (
                <div key={r.referrer}>
                  <div className="mb-1 flex min-w-0 items-center gap-2 text-xs">
                    <span className="flex-1 min-w-0 truncate font-medium text-foreground" title={r.referrer}>
                      {r.referrer}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {r.count.toLocaleString()}
                      <span className="ml-1 text-[10px]">({Math.round((r.count / (totalViews || 1)) * 100)}%)</span>
                    </span>
                  </div>
                  <MiniBar pct={(r.count / topRefCount) * 100} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-5 text-sm font-semibold text-foreground">Devices</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Desktop", count: desktop, Icon: Monitor,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Mobile",  count: mobile,  Icon: Smartphone, color: "text-sky-500",     bg: "bg-sky-500/10" },
            { label: "Tablet",  count: tablet,  Icon: Tablet,     color: "text-violet-500",  bg: "bg-violet-500/10" },
          ].map(({ label, count, Icon, color, bg }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border p-4">
              <div className={`flex size-10 items-center justify-center rounded-xl ${bg} ${color}`}>
                <Icon className="size-5" />
              </div>
              <p className={`text-xl font-bold ${color}`}>{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs font-medium text-foreground">
                {Math.round((count / totalDevices) * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {totalViews === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Analytics will populate as visitors browse the site.
        </p>
      )}
    </main>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}

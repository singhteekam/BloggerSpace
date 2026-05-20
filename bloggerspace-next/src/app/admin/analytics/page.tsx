"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart2, Globe, Monitor, Smartphone, Tablet, RefreshCw } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { analyticsApi, type AnalyticsData } from "@/lib/api/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <AnalyticsSkeleton />;
  if (!user) return null;
  return <AnalyticsDashboard userId={user._id} />;
}

// ── Country code → flag emoji ────────────────────────────────────────────────
function flag(code: string) {
  if (!code || code === "XX" || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

// Country code → name (common subset)
const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom", CA: "Canada",
  AU: "Australia", DE: "Germany", FR: "France", SG: "Singapore",
  AE: "UAE", PK: "Pakistan", BD: "Bangladesh", NP: "Nepal",
  LK: "Sri Lanka", MY: "Malaysia", PH: "Philippines", NL: "Netherlands",
  SE: "Sweden", NO: "Norway", DK: "Denmark", IT: "Italy",
  ES: "Spain", BR: "Brazil", MX: "Mexico", JP: "Japan",
  KR: "South Korea", CN: "China", ZA: "South Africa", NG: "Nigeria",
  XX: "Unknown",
};

function countryName(code: string) {
  return COUNTRY_NAMES[code] ?? code;
}

// ── SVG Bar Chart (30-day timeline) ─────────────────────────────────────────
function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 700;
  const h = 100;
  const barW = Math.floor(w / data.length) - 1;

  return (
    <svg
      viewBox={`0 0 ${w} ${h + 20}`}
      className="w-full"
      aria-label="30-day visit timeline"
    >
      {data.map((d, i) => {
        const barH = Math.max(2, (d.count / max) * h);
        const x = i * (barW + 1);
        const y = h - barH;
        const isToday = i === data.length - 1;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              className={isToday ? "fill-primary" : "fill-primary/40"}
            />
            <title>{`${d.date}: ${d.count} visits`}</title>
          </g>
        );
      })}
      {/* X-axis labels — show every 7th day */}
      {data.map((d, i) => {
        if (i % 7 !== 0 && i !== data.length - 1) return null;
        const x = i * (barW + 1) + barW / 2;
        return (
          <text
            key={`lbl-${i}`}
            x={x}
            y={h + 16}
            textAnchor="middle"
            fontSize={9}
            className="fill-muted-foreground"
          >
            {d.date.slice(5)} {/* MM-DD */}
          </text>
        );
      })}
    </svg>
  );
}

// ── Mini bar for tables ───────────────────────────────────────────────────────
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", userId],
    queryFn: () => analyticsApi.getStats(userId).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-analytics"] });

  if (isLoading || !data) return <AnalyticsSkeleton />;

  const { summary, countries, pages, devices, timeline } = data as AnalyticsData;

  const totalVisits = summary.totalCount;
  const topCountryCount = countries[0]?.count ?? 1;
  const topPageCount = pages[0]?.count ?? 1;
  const totalDevices = devices.reduce((s, d) => s + d.count, 0) || 1;

  const deviceMap = Object.fromEntries(devices.map((d) => [d.device, d.count]));
  const desktop = deviceMap["desktop"] ?? 0;
  const mobile  = deviceMap["mobile"]  ?? 0;
  const tablet  = deviceMap["tablet"]  ?? 0;

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
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Today",      value: summary.todayCount,  color: "text-sky-500" },
          { label: "This Week",  value: summary.weekCount,   color: "text-emerald-500" },
          { label: "This Month", value: summary.monthCount,  color: "text-violet-500" },
          { label: "All Time",   value: summary.totalCount,  color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 30-day timeline */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Last 30 Days</p>
        {timeline.length > 0 ? (
          <TimelineChart data={timeline} />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
        )}
      </div>

      {/* Countries + Top Pages */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Countries */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="size-4 text-sky-500" />
            <p className="text-sm font-semibold text-foreground">Countries</p>
          </div>
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {countries.map((c) => (
                <div key={c.code}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="text-base leading-none">{flag(c.code)}</span>
                      {countryName(c.code)}
                    </span>
                    <span className="text-muted-foreground">
                      {c.count.toLocaleString()}
                      <span className="ml-1 text-[10px]">
                        ({Math.round((c.count / (totalVisits || 1)) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <MiniBar pct={(c.count / topCountryCount) * 100} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="rounded-2xl border border-border bg-card p-5">
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
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span
                      className="max-w-[65%] truncate font-medium text-foreground"
                      title={p.page}
                    >
                      {p.page}
                    </span>
                    <span className="text-muted-foreground">{p.count.toLocaleString()}</span>
                  </div>
                  <MiniBar pct={(p.count / topPageCount) * 100} />
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

      {totalVisits === 0 && (
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
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}

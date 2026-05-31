"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  BarChart2, Monitor, Smartphone, Tablet, RefreshCw, Link2, Clock, Eye, Users,
  Globe, MonitorSmartphone, Search, X, ChevronLeft, ChevronRight, Trash2,
  Loader2, Activity, ListFilter,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import {
  analyticsApi, DELETE_RETENTION_OPTIONS,
  type AnalyticsData, type TimelinePoint, type VisitorRow, type VisitorLogRow,
} from "@/lib/api/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// ── Helpers ───────────────────────────────────────────────────────────────────
const IST = "Asia/Kolkata";
function fmtDateTime(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    timeZone: IST, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
function fmtDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { timeZone: IST, day: "2-digit", month: "short", year: "numeric" });
}
function shortId(id: string | null | undefined) {
  if (!id) return "—";
  return id.length > 16 ? `${id.slice(0, 14)}…` : id;
}

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <AnalyticsSkeleton />;
  if (!user) return null;
  return <AnalyticsRoot userId={user._id} />;
}

function AnalyticsRoot({ userId }: { userId: string }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart2 className="size-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Visitor insights, activity & traffic — all times in IST</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview"><BarChart2 className="mr-1.5 size-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="visitors"><Users className="mr-1.5 size-3.5" />Visitors</TabsTrigger>
          <TabsTrigger value="logs"><ListFilter className="mr-1.5 size-3.5" />Raw Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab userId={userId} /></TabsContent>
        <TabsContent value="visitors"><VisitorsTab userId={userId} /></TabsContent>
        <TabsContent value="logs"><LogsTab userId={userId} /></TabsContent>
      </Tabs>
    </main>
  );
}

// ════════════════════════════ OVERVIEW TAB ════════════════════════════════════
function OverviewTab({ userId }: { userId: string }) {
  const [timelineMode, setTimelineMode] = useState<"views" | "visitors">("views");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-analytics", userId],
    queryFn: () => analyticsApi.getStats(userId).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) return <OverviewSkeleton />;

  const { summary, pages, devices, browsers, os, referrers, hours, timeline } = data as AnalyticsData;
  const totalViews   = summary.totalViews;
  const totalDevices = devices.reduce((s, d) => s + d.count, 0) || 1;
  const deviceMap = Object.fromEntries(devices.map((d) => [d.device, d.count]));
  const peakHour = hours.reduce((best, h) => (h.count > best.count ? h : best), { hour: 0, count: 0 });

  const summaryCards = [
    { period: "Today",        views: summary.todayViews, unique: summary.todayUnique },
    { period: "This Week",    views: summary.weekViews,  unique: summary.weekUnique },
    { period: "This Month",   views: summary.monthViews, unique: summary.monthUnique },
    { period: "Last 90 Days", views: summary.totalViews, unique: summary.totalUnique },
  ];
  const colors = ["text-sky-500", "text-emerald-500", "text-violet-500", "text-amber-500"];

  return (
    <div>
      <div className="mb-5 flex items-center justify-end">
        <Button variant="outline" size="sm" className="gap-1.5"
          onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* Unique Visitors — actual people (highlighted) */}
      <div className="mb-2 flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Unique Visitors</p>
        <span className="text-xs text-muted-foreground">— distinct people who visited</span>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((s, i) => (
          <StatCard key={s.period} period={s.period} value={s.unique} color={colors[i]} highlight />
        ))}
      </div>

      {/* Page Views */}
      <div className="mb-2 flex items-center gap-2">
        <Eye className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Page Views</p>
        <span className="text-xs text-muted-foreground">— total pages opened</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((s, i) => (
          <StatCard key={s.period} period={s.period} value={s.views} color={colors[i]} />
        ))}
      </div>
      <p className="mb-8 text-[11px] text-muted-foreground">
        A “view” = one page per visitor per 30-min session (reloads don’t inflate it). A “unique visitor” = one distinct person.
        Totals are capped at 90 days (logs auto-expire).
      </p>

      {/* Timeline */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Last 30 Days</p>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs">
            {(["views", "visitors"] as const).map((m) => (
              <button key={m} onClick={() => setTimelineMode(m)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${timelineMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "views" ? "Views" : "Unique"}
              </button>
            ))}
          </div>
        </div>
        {timeline.some((d) => d.views > 0) ? <TimelineChart data={timeline} mode={timelineMode} /> :
          <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>}
      </div>

      {/* Hourly */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock className="size-4 text-emerald-500" /><p className="text-sm font-semibold">Traffic by Hour (IST)</p></div>
          {peakHour.count > 0 && (
            <p className="text-xs text-muted-foreground">Peak:{" "}
              <span className="font-medium text-foreground">{String(peakHour.hour).padStart(2, "0")}:00–{String((peakHour.hour + 1) % 24).padStart(2, "0")}:00</span></p>
          )}
        </div>
        {hours.some((h) => h.count > 0) ? <HourlyChart data={hours} /> :
          <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>}
      </div>

      {/* Top pages + referrers */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BreakdownCard icon={<BarChart2 className="size-4 text-violet-500" />} title="Top Pages" scope
          items={pages.map((p) => ({ label: p.page, count: p.count }))} total={totalViews} />
        <BreakdownCard icon={<Link2 className="size-4 text-sky-500" />} title="Top Referrers" scope
          empty="No referrer data yet — direct/bookmark traffic has no referrer."
          items={referrers.map((r) => ({ label: r.referrer, count: r.count }))} total={totalViews} />
      </div>

      {/* Browsers + OS */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BreakdownCard icon={<Globe className="size-4 text-amber-500" />} title="Browsers" scope
          items={browsers.map((b) => ({ label: b.browser, count: b.count }))} total={totalViews} />
        <BreakdownCard icon={<MonitorSmartphone className="size-4 text-teal-500" />} title="Operating Systems" scope
          items={os.map((o) => ({ label: o.os, count: o.count }))} total={totalViews} />
      </div>

      {/* Devices */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold">Devices</p>
        <p className="mb-5 text-[11px] text-muted-foreground">Last 90 days</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Desktop", count: deviceMap["desktop"] ?? 0, Icon: Monitor, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Mobile", count: deviceMap["mobile"] ?? 0, Icon: Smartphone, color: "text-sky-500", bg: "bg-sky-500/10" },
            { label: "Tablet", count: deviceMap["tablet"] ?? 0, Icon: Tablet, color: "text-violet-500", bg: "bg-violet-500/10" },
          ].map(({ label, count, Icon, color, bg }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border p-4">
              <div className={`flex size-10 items-center justify-center rounded-xl ${bg} ${color}`}><Icon className="size-5" /></div>
              <p className={`text-xl font-bold ${color}`}>{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs font-medium text-foreground">{Math.round((count / totalDevices) * 100)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ period, value, color, highlight }: {
  period: string; value: number; color: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground">{period}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function BreakdownCard({ icon, title, items, total, scope, empty }: {
  icon: React.ReactNode; title: string; items: { label: string; count: number }[];
  total: number; scope?: boolean; empty?: string;
}) {
  const top = items[0]?.count ?? 1;
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">{icon}<p className="text-sm font-semibold text-foreground">{title}</p></div>
      {scope && <p className="mb-4 text-[11px] text-muted-foreground">Last 90 days</p>}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty ?? "No data yet."}</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.label}>
              <div className="mb-1 flex min-w-0 items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground" title={it.label}>{it.label}</span>
                <span className="shrink-0 text-muted-foreground">{it.count.toLocaleString()}
                  <span className="ml-1 text-[10px]">({Math.round((it.count / (total || 1)) * 100)}%)</span></span>
              </div>
              <MiniBar pct={(it.count / top) * 100} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════ VISITORS TAB ════════════════════════════════════
function VisitorsTab({ userId }: { userId: string }) {
  // Pending — what the user is editing in the UI
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<'lastSeen' | 'firstSeen' | 'visits' | 'pageCount'>('lastSeen');
  // Applied — drives the actual API call (only updated on Apply / Clear)
  const [applied, setApplied] = useState<{ q: string; from: string; to: string; sort: 'lastSeen' | 'firstSeen' | 'visits' | 'pageCount' }>({ q: '', from: '', to: '', sort: 'lastSeen' });
  const [page, setPage] = useState(1);
  const [openVisitor, setOpenVisitor] = useState<string | null>(null);

  const filter = {
    q: applied.q,
    from: applied.from || undefined,
    to: applied.to ? applied.to + 'T23:59:59.999Z' : undefined,
    sort: applied.sort,
    page,
    limit: 25,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-visitors', userId, filter],
    queryFn: () => analyticsApi.getVisitors(userId, filter).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const apply = () => {
    setApplied({ q: search.trim(), from, to, sort });
    setPage(1);
  };
  const clearAll = () => {
    setSearch(''); setFrom(''); setTo(''); setSort('lastSeen');
    setApplied({ q: '', from: '', to: '', sort: 'lastSeen' });
    setPage(1);
  };
  const hasApplied = applied.q || applied.from || applied.to;

  const handleFromChange = (val: string) => {
    setFrom(val);
    if (to && val > to) setTo('');
  };

  return (
    <div>
      <div className='mb-4 flex flex-wrap items-end gap-2'>
        <div className='relative min-w-48 flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder='Search visitor ID or country...' className='pl-9' />
        </div>
        <div className='flex items-center gap-1.5'>
          <label className='text-xs text-muted-foreground whitespace-nowrap'>From</label>
          <DateInput value={from} max={to || undefined}
            onChange={handleFromChange} className='h-9 w-36 text-sm' />
        </div>
        <div className='flex items-center gap-1.5'>
          <label className='text-xs text-muted-foreground whitespace-nowrap'>To</label>
          <DateInput value={to} min={from || undefined}
            onChange={setTo} className='h-9 w-36 text-sm' />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className='h-9 rounded-md border border-input bg-background px-3 text-sm'>
          <option value='lastSeen'>Last seen</option>
          <option value='firstSeen'>First seen</option>
          <option value='visits'>Most visits</option>
          <option value='pageCount'>Most pages</option>
        </select>
        <Button variant='outline' size='sm' onClick={apply}>Apply</Button>
        {(hasApplied || search || from || to) && <Button variant='ghost' size='sm' onClick={clearAll}><X className='size-3.5 mr-1' />Clear</Button>}
      </div>

      {isLoading ? <TableSkeleton /> : !data || data.visitors.length === 0 ? (
        <EmptyBox msg={hasApplied ? 'No visitors match your filters.' : 'No visitor activity yet.'} />
      ) : (
        <>
          <div className='overflow-x-auto rounded-xl border border-border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-xs text-muted-foreground'>
                <tr>
                  <Th>Visitor</Th><Th>Visits</Th><Th>Pages</Th>
                  <Th>Device / Browser</Th><Th>First seen</Th><Th>Last seen</Th><Th></Th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {data.visitors.map((v: VisitorRow) => (
                  <tr key={v.visitorId} className='hover:bg-muted/30'>
                    <Td><span className='font-mono text-xs' title={v.visitorId ?? ''}>{shortId(v.visitorId)}</span></Td>
                    <Td><Badge variant='secondary' className='text-xs'>{v.visits}</Badge></Td>
                    <Td>{v.pageCount}</Td>
                    <Td className='text-xs text-muted-foreground'>{v.device || '—'} · {v.browser || '—'}</Td>
                    <Td className='text-xs text-muted-foreground'>{fmtDate(v.firstSeen)}</Td>
                    <Td className='text-xs text-muted-foreground'>{fmtDateTime(v.lastSeen)}</Td>
                    <Td>
                      <Button size='sm' variant='ghost' className='h-7 gap-1 text-xs' onClick={() => setOpenVisitor(v.visitorId)}>
                        <Activity className='size-3.5' />Journey
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} total={data.total} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        </>
      )}

      {openVisitor && <JourneyDialog userId={userId} visitorId={openVisitor} onClose={() => setOpenVisitor(null)} />}
    </div>
  );
}

function JourneyDialog({ userId, visitorId, onClose }: { userId: string; visitorId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitor-journey", userId, visitorId],
    queryFn: () => analyticsApi.getVisitorJourney(userId, visitorId).then((r) => r.data),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 text-sm">
            <Activity className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="min-w-0 break-all font-mono">{visitorId}</span>
          </DialogTitle>
          <DialogDescription>Full activity timeline for this visitor.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : !data || !data.summary ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity found.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Visits" value={String(data.summary.visits)} />
              <Stat label="Device" value={data.summary.device || "—"} />
              <Stat label="Browser / OS" value={`${data.summary.browser || "—"} · ${data.summary.os || "—"}`} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              First seen {fmtDateTime(data.summary.firstSeen)} · Last seen {fmtDateTime(data.summary.lastSeen)}
            </p>

            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Journey ({data.journey.length} page views)
            </p>
            <ol className="relative space-y-1 border-l border-border pl-4">
              {data.journey.map((j, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary/60" />
                  <div className="rounded-md px-2 py-1 hover:bg-muted/40">
                    <p className="break-all text-sm">{j.page}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {fmtDateTime(j.timestamp)}
                      {j.referrer ? ` · from ${j.referrer}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════ LOGS TAB ════════════════════════════════════════
function LogsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  // Pending — what the user is editing
  const [search, setSearch] = useState('');
  const [device, setDevice] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  // Applied — drives the API call
  const [applied, setApplied] = useState<{ q: string; device: string; from: string; to: string; sort: 'newest' | 'oldest' }>({ q: '', device: '', from: '', to: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [retention, setRetention] = useState<number>(30);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filter = {
    q: applied.q,
    device: applied.device,
    from: applied.from || undefined,
    to: applied.to ? applied.to + 'T23:59:59.999Z' : undefined,
    sort: applied.sort,
    page,
    limit: 25,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', userId, filter],
    queryFn: () => analyticsApi.getLogs(userId, filter).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const delMutation = useMutation({
    mutationFn: () => analyticsApi.deleteOldLogs(userId, retention),
    onSuccess: (res) => {
      toast.success(`Deleted ${res.data.deletedCount.toLocaleString()} logs older than ${retention} days.`);
      qc.invalidateQueries({ queryKey: ['admin-logs'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
      qc.invalidateQueries({ queryKey: ['admin-visitors'] });
      setConfirmOpen(false);
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Error.'),
  });

  const apply = () => {
    setApplied({ q: search.trim(), device, from, to, sort });
    setPage(1);
  };
  const clearAll = () => {
    setSearch(''); setDevice(''); setFrom(''); setTo(''); setSort('newest');
    setApplied({ q: '', device: '', from: '', to: '', sort: 'newest' });
    setPage(1);
  };
  const hasApplied = applied.q || applied.device || applied.from || applied.to;

  const handleFromChange = (val: string) => {
    setFrom(val);
    if (to && val > to) setTo('');
  };

  return (
    <div>
      <div className='mb-4 flex flex-wrap items-end gap-2'>
        <div className='relative min-w-48 flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder='Search page, referrer, visitor, country...' className='pl-9' />
        </div>
        <select value={device} onChange={(e) => setDevice(e.target.value)}
          className='h-9 rounded-md border border-input bg-background px-3 text-sm'>
          <option value=''>All devices</option>
          <option value='desktop'>Desktop</option>
          <option value='mobile'>Mobile</option>
          <option value='tablet'>Tablet</option>
        </select>
        <div className='flex items-center gap-1.5'>
          <label className='text-xs text-muted-foreground whitespace-nowrap'>From</label>
          <DateInput value={from} max={to || undefined}
            onChange={handleFromChange} className='h-9 w-36 text-sm' />
        </div>
        <div className='flex items-center gap-1.5'>
          <label className='text-xs text-muted-foreground whitespace-nowrap'>To</label>
          <DateInput value={to} min={from || undefined}
            onChange={setTo} className='h-9 w-36 text-sm' />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className='h-9 rounded-md border border-input bg-background px-3 text-sm'>
          <option value='newest'>Newest first</option>
          <option value='oldest'>Oldest first</option>
        </select>
        <Button variant='outline' size='sm' onClick={apply}>Apply</Button>
        {(hasApplied || search || device || from || to) && <Button variant='ghost' size='sm' onClick={clearAll}><X className='size-3.5 mr-1' />Clear</Button>}
      </div>

      <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10'>
        <p className='text-xs text-muted-foreground'>
          <Trash2 className='mr-1 inline size-3.5 text-amber-600' />
          Clean up old logs. (Logs also auto-expire after 90 days.)
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>Delete older than</span>
          <select value={retention} onChange={(e) => setRetention(Number(e.target.value))}
            className='h-8 rounded-md border border-input bg-background px-2 text-sm'>
            {DELETE_RETENTION_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
          <Button size='sm' variant='destructive' className='h-8 gap-1.5' onClick={() => setConfirmOpen(true)}>
            <Trash2 className='size-3.5' />Delete
          </Button>
        </div>
      </div>

      {isLoading ? <TableSkeleton /> : !data || data.logs.length === 0 ? (
        <EmptyBox msg={hasApplied ? 'No logs match your filters.' : 'No logs yet.'} />
      ) : (
        <>
          <div className='overflow-x-auto rounded-xl border border-border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-xs text-muted-foreground'>
                <tr><Th>Time (IST)</Th><th className='px-3 py-2.5 text-left font-medium min-w-[280px]'>Page</th><Th>Visitor</Th><Th>Device</Th><Th>Browser / OS</Th><Th>Referrer</Th></tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {data.logs.map((l: VisitorLogRow) => (
                  <tr key={l._id} className='hover:bg-muted/30'>
                    <Td className='whitespace-nowrap text-xs text-muted-foreground'>{fmtDateTime(l.timestamp)}</Td>
                    <Td><span className='block break-all text-xs'>{l.page}</span></Td>
                    <Td><span className='font-mono text-[11px]' title={l.visitorId}>{l.visitorId ? shortId(l.visitorId) : '—'}</span></Td>
                    <Td className='text-xs'>{l.device || '—'}</Td>
                    <Td className='text-xs text-muted-foreground'>{l.browser || '—'} · {l.os || '—'}</Td>
                    <Td><span className='block max-w-[120px] truncate text-xs text-muted-foreground' title={l.referrer}>{l.referrer || 'direct'}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} total={data.total} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        </>
      )}

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete logs older than {retention} days?</DialogTitle>
            <DialogDescription>
              This permanently removes all visitor logs older than {retention} days. Analytics for that period will be lost. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={delMutation.isPending}>Cancel</Button>
            <Button variant="destructive" className="gap-1.5" onClick={() => delMutation.mutate()} disabled={delMutation.isPending}>
              {delMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete logs
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────
function DateInput({ value, onChange, min, max, className }: {
  value: string; onChange: (v: string) => void; min?: string; max?: string; className?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Input
      type={focused || value ? 'date' : 'text'}
      placeholder={!focused && !value ? 'dd/mm/yyyy' : undefined}
      value={value}
      min={min}
      max={max}
      className={className}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-3 py-2.5 text-left font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
    </div>
  );
}
function Pagination({ page, pages, total, onPrev, onNext }: { page: number; pages: number; total: number; onPrev: () => void; onNext: () => void }) {
  if (pages <= 1) return <p className="mt-3 text-center text-xs text-muted-foreground">{total.toLocaleString()} total</p>;
  return (
    <div className="mt-4 flex items-center justify-between">
      <Button variant="outline" size="sm" className="gap-1.5" disabled={page <= 1} onClick={onPrev}><ChevronLeft className="size-3.5" />Previous</Button>
      <span className="text-xs text-muted-foreground">Page {page} of {pages} · {total.toLocaleString()} total</span>
      <Button variant="outline" size="sm" className="gap-1.5" disabled={page >= pages} onClick={onNext}>Next<ChevronRight className="size-3.5" /></Button>
    </div>
  );
}
function EmptyBox({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Globe className="size-5" /></div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function TimelineChart({ data, mode }: { data: TimelinePoint[]; mode: "views" | "visitors" }) {
  const vals = data.map((d) => (mode === "views" ? d.views : d.visitors));
  const max = Math.max(...vals, 1);
  const W = 700, H = 100;
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
        return <text key={`lbl-${i}`} x={i * (barW + 1) + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} className="fill-muted-foreground">{d.date.slice(5)}</text>;
      })}
    </svg>
  );
}
function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 700, H = 60;
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
        <text key={h} x={h * (barW + 1) + barW / 2} y={H + 14} textAnchor="middle" fontSize={9} className="fill-muted-foreground">{`${String(h).padStart(2, "0")}h`}</text>
      ))}
    </svg>
  );
}
function MiniBar({ pct }: { pct: number }) {
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} /></div>;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-36 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
    </div>
  );
}
function TableSkeleton() {
  return <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}</div>;
}
function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Skeleton className="h-12 w-64" /><Skeleton className="h-10 w-72 rounded-lg" />
      <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}

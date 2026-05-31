import { api } from "./client";

export type AnalyticsSummary = {
  todayViews: number;
  weekViews: number;
  monthViews: number;
  totalViews: number;
  todayUnique: number;
  weekUnique: number;
  monthUnique: number;
  totalUnique: number;
};

export type PageStat      = { page: string; count: number };
export type DeviceStat    = { device: string; count: number };
export type BrowserStat   = { browser: string; count: number };
export type OsStat        = { os: string; count: number };
export type CountryStat   = { country: string; count: number };
export type ReferrerStat  = { referrer: string; count: number };
export type HourPoint     = { hour: number; count: number };
export type TimelinePoint = { date: string; views: number; visitors: number };

export type AnalyticsData = {
  summary: AnalyticsSummary;
  pages: PageStat[];
  devices: DeviceStat[];
  browsers: BrowserStat[];
  os: OsStat[];
  countries: CountryStat[];
  referrers: ReferrerStat[];
  hours: HourPoint[];
  timeline: TimelinePoint[];
};

// ── Raw logs ──────────────────────────────────────────────────────────────────
export type VisitorLogRow = {
  _id: string;
  page: string;
  visitorId: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  referrer: string;
  timestamp: string;
};

export type LogsResponse = {
  logs: VisitorLogRow[];
  total: number;
  page: number;
  pages: number;
};

export type LogsFilter = {
  page?: number;
  limit?: number;
  q?: string;
  device?: string;
  country?: string;
  visitorId?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
};

export type VisitorFilter = {
  page?: number;
  limit?: number;
  q?: string;
  from?: string;
  to?: string;
  sort?: "lastSeen" | "firstSeen" | "visits" | "pageCount";
};

// ── Visitors ──────────────────────────────────────────────────────────────────
export type VisitorRow = {
  visitorId: string;
  visits: number;
  pageCount: number;
  firstSeen: string;
  lastSeen: string;
  country: string;
  device: string;
  browser: string;
  os: string;
  lastPage: string;
};

export type VisitorsResponse = {
  visitors: VisitorRow[];
  total: number;
  page: number;
  pages: number;
};

export type VisitorJourney = {
  visitorId: string;
  summary: {
    visits: number;
    firstSeen: string;
    lastSeen: string;
    country: string;
    device: string;
    browser: string;
    os: string;
    devices: string[];
    topPages: { page: string; count: number }[];
  } | null;
  journey: {
    page: string;
    referrer: string;
    device: string;
    browser: string;
    os: string;
    country: string;
    timestamp: string;
  }[];
};

export const DELETE_RETENTION_OPTIONS = [7, 15, 30, 60, 90] as const;

export const analyticsApi = {
  track: (page: string, referrer = "", visitorId = "") =>
    api.post("/api/analytics/track", { page, referrer, visitorId }),

  getStats: (userId: string) =>
    api.get<AnalyticsData>("/api/analytics/stats", {
      params: { userId, role: "Admin" },
    }),

  getLogs: (userId: string, filter: LogsFilter = {}) =>
    api.get<LogsResponse>("/api/analytics/logs", {
      params: { userId, role: "Admin", ...filter },
    }),

  getVisitors: (userId: string, filter: VisitorFilter = {}) =>
    api.get<VisitorsResponse>("/api/analytics/visitors", {
      params: { userId, role: "Admin", ...filter },
    }),

  getVisitorJourney: (userId: string, visitorId: string) =>
    api.get<VisitorJourney>(`/api/analytics/visitor/${encodeURIComponent(visitorId)}`, {
      params: { userId, role: "Admin" },
    }),

  deleteOldLogs: (userId: string, olderThanDays: number) =>
    api.delete<{ deletedCount: number; days: number }>("/api/analytics/logs", {
      params: { userId, role: "Admin", olderThanDays },
    }),
};

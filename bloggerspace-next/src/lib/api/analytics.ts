import { api } from "./client";

export type AnalyticsSummary = {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  totalCount: number;
};

export type CountryStat = { code: string; count: number };
export type PageStat   = { page: string; count: number };
export type DeviceStat = { device: string; count: number };
export type TimelinePoint = { date: string; count: number };

export type AnalyticsData = {
  summary: AnalyticsSummary;
  countries: CountryStat[];
  pages: PageStat[];
  devices: DeviceStat[];
  timeline: TimelinePoint[];
};

export const analyticsApi = {
  track: (page: string, referrer = "") =>
    api.post("/api/analytics/track", { page, referrer }),

  getStats: (userId: string) =>
    api.get<AnalyticsData>("/api/analytics/stats", {
      params: { userId, role: "Admin" },
    }),
};

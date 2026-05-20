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
export type ReferrerStat  = { referrer: string; count: number };
export type HourPoint     = { hour: number; count: number };
export type TimelinePoint = { date: string; views: number; visitors: number };

export type AnalyticsData = {
  summary: AnalyticsSummary;
  pages: PageStat[];
  devices: DeviceStat[];
  referrers: ReferrerStat[];
  hours: HourPoint[];
  timeline: TimelinePoint[];
};

export const analyticsApi = {
  track: (page: string, referrer = "", visitorId = "") =>
    api.post("/api/analytics/track", { page, referrer, visitorId }),

  getStats: (userId: string) =>
    api.get<AnalyticsData>("/api/analytics/stats", {
      params: { userId, role: "Admin" },
    }),
};

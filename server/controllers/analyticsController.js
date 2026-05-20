const VisitorLog = require("../models/VisitorLog");

function getDevice(ua = "") {
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function getDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

exports.trackVisit = async (req, res) => {
  try {
    const { page = "/", referrer = "", visitorId = "" } = req.body;
    if (!page || page.startsWith("/admin") || page.startsWith("/api")) {
      return res.status(200).json({ ok: true });
    }
    const ua = req.headers["user-agent"] ?? "";
    const device = getDevice(ua);
    const now = new Date();
    const dayKey = getDayKey(now);

    await VisitorLog.create({
      page,
      visitorId,
      device,
      referrer: (() => { try { return referrer ? new URL(referrer).hostname : ""; } catch (_) { return ""; } })(),
      dayKey,
      weekKey: getWeekKey(now),
      monthKey: getMonthKey(now),
      timestamp: now,
    });

    res.status(200).json({ ok: true });
  } catch (_) {
    res.status(200).json({ ok: true });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const todayKey = getDayKey(now);
    const weekKey = getWeekKey(now);
    const monthKey = getMonthKey(now);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const startKey = getDayKey(thirtyDaysAgo);

    const [
      todayViews, weekViews, monthViews, totalViews,
      todayUnique, weekUnique, monthUnique, totalUnique,
      pageData, deviceData, referrerData, hourData, timelineRaw,
    ] = await Promise.all([
      // Page views (all hits)
      VisitorLog.countDocuments({ dayKey: todayKey }),
      VisitorLog.countDocuments({ weekKey }),
      VisitorLog.countDocuments({ monthKey }),
      VisitorLog.countDocuments(),
      // Unique visitors (distinct visitorId per period)
      VisitorLog.distinct("visitorId", { dayKey: todayKey, visitorId: { $ne: "" } }).then((r) => r.length),
      VisitorLog.distinct("visitorId", { weekKey, visitorId: { $ne: "" } }).then((r) => r.length),
      VisitorLog.distinct("visitorId", { monthKey, visitorId: { $ne: "" } }).then((r) => r.length),
      VisitorLog.distinct("visitorId", { visitorId: { $ne: "" } }).then((r) => r.length),
      // Top pages
      VisitorLog.aggregate([
        { $group: { _id: "$page", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // Devices
      VisitorLog.aggregate([
        { $group: { _id: "$device", count: { $sum: 1 } } },
      ]),
      // Top referrers
      VisitorLog.aggregate([
        { $match: { referrer: { $nin: ["", null] } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // Traffic by hour of day (UTC)
      VisitorLog.aggregate([
        { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // 30-day daily timeline
      VisitorLog.aggregate([
        { $match: { dayKey: { $gte: startKey } } },
        { $group: { _id: "$dayKey", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const timelineMap = Object.fromEntries(
      timelineRaw.map((d) => [d._id, {
        views: d.views,
        visitors: d.visitors.filter((v) => v !== "").length,
      }])
    );
    const timeline = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const key = getDayKey(d);
      return { date: key, views: timelineMap[key]?.views ?? 0, visitors: timelineMap[key]?.visitors ?? 0 };
    });

    const hourMap = Object.fromEntries(hourData.map((h) => [h._id, h.count]));
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: hourMap[i] ?? 0 }));

    res.json({
      summary: {
        todayViews, weekViews, monthViews, totalViews,
        todayUnique, weekUnique, monthUnique, totalUnique,
      },
      pages: pageData.map((p) => ({ page: p._id, count: p.count })),
      devices: deviceData.map((d) => ({ device: d._id, count: d.count })),
      referrers: referrerData.map((r) => ({ referrer: r._id, count: r.count })),
      hours,
      timeline,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

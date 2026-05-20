const VisitorLog = require("../models/VisitorLog");

let geoip = null;
try { geoip = require("geoip-lite"); } catch (_) {}

function getIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? req.ip ?? "";
}

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

function getCountryCode(ip) {
  if (!geoip || !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168") || ip.startsWith("10.")) return "XX";
  const geo = geoip.lookup(ip);
  return geo?.country ?? "XX";
}

exports.trackVisit = async (req, res) => {
  try {
    const { page = "/", referrer = "" } = req.body;
    if (!page || page.startsWith("/admin") || page.startsWith("/api")) {
      return res.status(200).json({ ok: true });
    }
    const ip = getIp(req);
    const ua = req.headers["user-agent"] ?? "";
    const countryCode = getCountryCode(ip);
    const device = getDevice(ua);
    const now = new Date();

    await VisitorLog.create({
      page,
      countryCode,
      device,
      referrer: (() => { try { return referrer ? new URL(referrer).hostname : ""; } catch (_) { return ""; } })(),
      dayKey: getDayKey(now),
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

    const [todayCount, weekCount, monthCount, totalCount, countryData, pageData, deviceData, timelineRaw] =
      await Promise.all([
        VisitorLog.countDocuments({ dayKey: todayKey }),
        VisitorLog.countDocuments({ weekKey }),
        VisitorLog.countDocuments({ monthKey }),
        VisitorLog.countDocuments(),
        VisitorLog.aggregate([
          { $group: { _id: "$countryCode", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]),
        VisitorLog.aggregate([
          { $group: { _id: "$page", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        VisitorLog.aggregate([
          { $group: { _id: "$device", count: { $sum: 1 } } },
        ]),
        VisitorLog.aggregate([
          { $match: { dayKey: { $gte: startKey } } },
          { $group: { _id: "$dayKey", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const timelineMap = Object.fromEntries(timelineRaw.map((d) => [d._id, d.count]));
    const timeline = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const key = getDayKey(d);
      return { date: key, count: timelineMap[key] ?? 0 };
    });

    res.json({
      summary: { todayCount, weekCount, monthCount, totalCount },
      countries: countryData.map((c) => ({ code: c._id, count: c.count })),
      pages: pageData.map((p) => ({ page: p._id, count: p.count })),
      devices: deviceData.map((d) => ({ device: d._id, count: d.count })),
      timeline,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

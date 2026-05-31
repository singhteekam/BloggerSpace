const crypto = require("crypto");
const VisitorLog = require("../models/VisitorLog");

// India Standard Time has no DST, so a fixed +5:30 offset is exact.
const IST_MS = 330 * 60000;
const TZ = "Asia/Kolkata";
const DELETE_OPTIONS = [7, 15, 30, 60, 90];

// A repeat view of the same page by the same visitor within this window is NOT
// logged again — so refreshing/re-opening a page doesn't inflate view counts.
// One "view" therefore means one page-per-visitor per ~session, not per reload.
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes (standard session window)

// ── Detection helpers ─────────────────────────────────────────────────────────
function getDevice(ua = "") {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getBrowser(ua = "") {
  if (/edg/i.test(ua)) return "Edge";          // must precede Chrome/Safari
  if (/opr|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome"; // must precede Safari
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/msie|trident/i.test(ua)) return "IE";
  return "Other";
}

function getOS(ua = "") {
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";    // must precede Linux
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function getClientIp(req) {
  return (
    req.headers["cf-connecting-ip"] ||
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    ""
  );
}

function getCountry(req) {
  const raw = (req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || "")
    .toString()
    .toUpperCase()
    .slice(0, 2);
  // Cloudflare uses "XX"/"T1" for unknown/Tor — treat as empty
  return raw === "XX" || raw === "T1" ? "" : raw;
}

function getIpHash(ip) {
  if (!ip) return "";
  const salt = process.env.IP_HASH_SALT || process.env.SESSION_SECRET || "bs-analytics-salt";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex").slice(0, 16);
}

// ── IST date-key helpers (write path) ─────────────────────────────────────────
function istShift(d) { return new Date(d.getTime() + IST_MS); }

function getDayKey(d = new Date()) { return istShift(d).toISOString().slice(0, 10); }
function getMonthKey(d = new Date()) { return istShift(d).toISOString().slice(0, 7); }
function getWeekKey(d = new Date()) {
  const ist = istShift(d);
  ist.setUTCHours(0, 0, 0, 0);
  ist.setUTCDate(ist.getUTCDate() + 4 - (ist.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(ist.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((ist - yearStart) / 86400000 + 1) / 7);
  return `${ist.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ── IST range helpers (read path) — return real UTC instants for IST boundaries ─
function istTodayStart(d = new Date()) {
  const ist = istShift(d);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_MS);
}
function istWeekStart(d = new Date()) {
  const ist = istShift(d);
  const dow = (ist.getUTCDay() + 6) % 7; // Monday = 0
  ist.setUTCHours(0, 0, 0, 0);
  ist.setUTCDate(ist.getUTCDate() - dow);
  return new Date(ist.getTime() - IST_MS);
}
function istMonthStart(d = new Date()) {
  const ist = istShift(d);
  ist.setUTCHours(0, 0, 0, 0);
  ist.setUTCDate(1);
  return new Date(ist.getTime() - IST_MS);
}
function istDaysAgoStart(n, d = new Date()) {
  return new Date(istTodayStart(d).getTime() - n * 86400000);
}

// ── Public: track a page view ─────────────────────────────────────────────────
exports.trackVisit = async (req, res) => {
  try {
    const { page = "/", referrer = "", visitorId = "" } = req.body;
    if (!page || page.startsWith("/admin") || page.startsWith("/api")) {
      return res.status(200).json({ ok: true });
    }
    const ua = req.headers["user-agent"] ?? "";
    const now = new Date();
    const cleanPage = String(page).slice(0, 300);
    const ipHash = getIpHash(getClientIp(req));

    // ── Refresh-resistant dedup ──────────────────────────────────────
    // If this visitor already has a log for this exact page within the
    // session window, skip — prevents reload spam from inflating views.
    const dedupKey = visitorId || ipHash;
    if (dedupKey) {
      const dedupFilter = {
        page: cleanPage,
        timestamp: { $gte: new Date(now.getTime() - DEDUP_WINDOW_MS) },
        ...(visitorId ? { visitorId } : { ipHash }),
      };
      const recent = await VisitorLog.findOne(dedupFilter).select("_id").lean();
      if (recent) return res.status(200).json({ ok: true, deduped: true });
    }

    await VisitorLog.create({
      page: cleanPage,
      visitorId,
      device: getDevice(ua),
      browser: getBrowser(ua),
      os: getOS(ua),
      country: getCountry(req),
      ipHash,
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

// ── Admin: dashboard overview ─────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = istTodayStart(now);
    const weekStart = istWeekStart(now);
    const monthStart = istMonthStart(now);
    const timelineStart = istDaysAgoStart(29, now); // last 30 IST days incl. today

    const uniq = (filter) =>
      VisitorLog.distinct("visitorId", { ...filter, visitorId: { $ne: "" } }).then((r) => r.length);

    const [
      todayViews, weekViews, monthViews, totalViews,
      todayUnique, weekUnique, monthUnique, totalUnique,
      pageData, deviceData, browserData, osData, countryData, referrerData, hourData, timelineRaw,
    ] = await Promise.all([
      VisitorLog.countDocuments({ timestamp: { $gte: todayStart } }),
      VisitorLog.countDocuments({ timestamp: { $gte: weekStart } }),
      VisitorLog.countDocuments({ timestamp: { $gte: monthStart } }),
      VisitorLog.countDocuments(), // capped at 90 days by TTL
      uniq({ timestamp: { $gte: todayStart } }),
      uniq({ timestamp: { $gte: weekStart } }),
      uniq({ timestamp: { $gte: monthStart } }),
      uniq({}),
      VisitorLog.aggregate([
        { $group: { _id: "$page", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      VisitorLog.aggregate([{ $group: { _id: "$device", count: { $sum: 1 } } }]),
      VisitorLog.aggregate([
        { $match: { browser: { $nin: ["", null] } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      VisitorLog.aggregate([
        { $match: { os: { $nin: ["", null] } } },
        { $group: { _id: "$os", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      VisitorLog.aggregate([
        { $match: { country: { $nin: ["", null] } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      VisitorLog.aggregate([
        { $match: { referrer: { $nin: ["", null] } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      // Hour of day in IST
      VisitorLog.aggregate([
        { $group: { _id: { $hour: { date: "$timestamp", timezone: TZ } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // 30-day timeline grouped by IST calendar day
      VisitorLog.aggregate([
        { $match: { timestamp: { $gte: timelineStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: TZ } },
            views: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const timelineMap = Object.fromEntries(
      timelineRaw.map((d) => [d._id, { views: d.views, visitors: d.visitors.filter((v) => v !== "").length }]),
    );
    const timeline = Array.from({ length: 30 }, (_, i) => {
      const key = getDayKey(new Date(now.getTime() - (29 - i) * 86400000));
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
      browsers: browserData.map((b) => ({ browser: b._id, count: b.count })),
      os: osData.map((o) => ({ os: o._id, count: o.count })),
      countries: countryData.map((c) => ({ country: c._id, count: c.count })),
      referrers: referrerData.map((r) => ({ referrer: r._id, count: r.count })),
      hours,
      timeline,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

// ── Admin: paginated raw logs with filters ────────────────────────────────────
exports.getLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const { q = "", device = "", country = "", visitorId = "", from = "", to = "", sort = "newest" } = req.query;

    const filter = {};
    if (device) filter.device = device;
    if (country) filter.country = country;
    if (visitorId) filter.visitorId = visitorId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ page: rx }, { referrer: rx }, { visitorId: rx }, { country: rx }, { os: rx }, { browser: rx }];
    }

    const sortOrder = sort === "oldest" ? 1 : -1;

    const [logs, total] = await Promise.all([
      VisitorLog.find(filter).sort({ timestamp: sortOrder }).skip((page - 1) * limit).limit(limit).lean(),
      VisitorLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error("getLogs error:", err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

// ── Admin: distinct visitors with per-visitor aggregates ──────────────────────
exports.getVisitors = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const { q = "", from = "", to = "", sort = "lastSeen" } = req.query;

    const match = { visitorId: { $ne: "" } };
    if (from || to) {
      match.timestamp = {};
      if (from) match.timestamp.$gte = new Date(from);
      if (to)   match.timestamp.$lte = new Date(to);
    }
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ visitorId: rx }, { country: rx }];
    }

    const SORT_FIELDS = {
      lastSeen:  { lastSeen: -1 },
      firstSeen: { firstSeen: 1 },
      visits:    { visits: -1 },
      pageCount: { pageCount: -1 },
    };
    const sortStage = SORT_FIELDS[sort] || SORT_FIELDS.lastSeen;

    const [rows, totalArr] = await Promise.all([
      VisitorLog.aggregate([
        { $match: match },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: "$visitorId",
            visits: { $sum: 1 },
            pages: { $addToSet: "$page" },
            firstSeen: { $min: "$timestamp" },
            lastSeen: { $max: "$timestamp" },
            country: { $last: "$country" },
            device: { $last: "$device" },
            browser: { $last: "$browser" },
            os: { $last: "$os" },
            lastPage: { $last: "$page" },
          },
        },
        { $addFields: { pageCount: { $size: "$pages" } } },
        { $sort: sortStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _id: 0, visitorId: "$_id", visits: 1, pageCount: 1, firstSeen: 1, lastSeen: 1, country: 1, device: 1, browser: 1, os: 1, lastPage: 1 } },
      ]),
      VisitorLog.aggregate([{ $match: match }, { $group: { _id: "$visitorId" } }, { $count: "n" }]),
    ]);

    const total = totalArr[0]?.n ?? 0;
    res.json({ visitors: rows, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error("getVisitors error:", err);
    res.status(500).json({ message: "Failed to fetch visitors" });
  }
};

// ── Admin: one visitor's full journey ─────────────────────────────────────────
exports.getVisitorJourney = async (req, res) => {
  try {
    const { visitorId } = req.params;
    if (!visitorId) return res.status(400).json({ message: "visitorId required" });

    const logs = await VisitorLog.find({ visitorId })
      .sort({ timestamp: 1 })
      .limit(500)
      .lean();

    if (logs.length === 0) {
      return res.json({ visitorId, summary: null, journey: [] });
    }

    const pageCounts = {};
    const devices = new Set();
    for (const l of logs) {
      pageCounts[l.page] = (pageCounts[l.page] || 0) + 1;
      if (l.device) devices.add(l.device);
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    const last = logs[logs.length - 1];
    res.json({
      visitorId,
      summary: {
        visits: logs.length,
        firstSeen: logs[0].timestamp,
        lastSeen: last.timestamp,
        country: last.country || "",
        device: last.device || "",
        browser: last.browser || "",
        os: last.os || "",
        devices: [...devices],
        topPages,
      },
      journey: logs.map((l) => ({
        page: l.page, referrer: l.referrer, device: l.device, browser: l.browser,
        os: l.os, country: l.country, timestamp: l.timestamp,
      })),
    });
  } catch (err) {
    console.error("getVisitorJourney error:", err);
    res.status(500).json({ message: "Failed to fetch visitor journey" });
  }
};

// ── Admin: delete logs older than N days ──────────────────────────────────────
exports.deleteOldLogs = async (req, res) => {
  try {
    const days = parseInt(req.query.olderThanDays);
    if (!DELETE_OPTIONS.includes(days)) {
      return res.status(400).json({ message: `olderThanDays must be one of: ${DELETE_OPTIONS.join(", ")}` });
    }
    const cutoff = new Date(Date.now() - days * 86400000);
    const result = await VisitorLog.deleteMany({ timestamp: { $lt: cutoff } });
    res.json({ deletedCount: result.deletedCount ?? 0, days });
  } catch (err) {
    console.error("deleteOldLogs error:", err);
    res.status(500).json({ message: "Failed to delete logs" });
  }
};

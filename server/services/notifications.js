// ── FCM trending-digest notification service ──────────────────────────────────
// Cost-optimised: the scheduled job calls runNotificationCycle() once a day, but
// it does almost no work unless a digest is actually due AND new content exists.
const admin = require("firebase-admin");
const Blog = require("../models/Blog");
const FcmToken = require("../models/FcmToken");
const AdminConfig = require("../models/AdminConfig");
const NotificationLog = require("../models/NotificationLog");
const logger = require("../utils/Logging/logs");

const PUBLISHED = { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] };
const FCM_BATCH = 500; // FCM multicast hard limit per call
const SITE_URL = process.env.FRONTEND_URL || "https://www.singhteekam.in";

// Initialise firebase-admin exactly once. In the deployed Cloud Functions
// runtime this uses Application Default Credentials automatically (no key file).
let adminReady = false;
function ensureAdmin() {
  if (adminReady) return;
  if (!admin.apps.length) admin.initializeApp();
  adminReady = true;
}

// Published, recently-published, not-yet-notified blogs sorted by views.
async function getTrendingUnsentBlogs(count, windowDays) {
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  return Blog.find({
    status: PUBLISHED,
    digestNotifiedAt: null,
    createdAt: { $gte: windowStart },
  })
    .sort({ blogViews: -1 })
    .limit(count)
    .select("_id title slug category blogViews")
    .lean();
}

// Build the FCM multicast payload for a single digest notification.
function buildDigestMessage(blogs) {
  const top = blogs[0];
  const extra = blogs.length - 1;
  const title = "🔥 Trending on BloggerSpace";
  const body =
    extra > 0
      ? `${top.title} & ${extra} more trending read${extra > 1 ? "s" : ""}`
      : top.title;
  // Deep-link: single blog → that post; multiple → the blogs listing.
  const link = blogs.length === 1 ? `${SITE_URL}/blogs/${top.slug}` : `${SITE_URL}/blogs`;

  return {
    notification: { title, body },
    webpush: {
      notification: { title, body, icon: "/assets/logo128x128.png", badge: "/assets/logo128x128.png" },
      fcmOptions: { link },
    },
    data: { link, type: "trending-digest", count: String(blogs.length) },
  };
}

// Send one message to many tokens in batches of 500, returning the set of tokens
// FCM rejected as permanently invalid so the caller can prune them.
async function sendToTokens(message, tokens) {
  ensureAdmin();
  const messaging = admin.messaging();
  const invalid = [];
  let success = 0;
  let failure = 0;

  for (let i = 0; i < tokens.length; i += FCM_BATCH) {
    const batch = tokens.slice(i, i + FCM_BATCH);
    const res = await messaging.sendEachForMulticast({ ...message, tokens: batch });
    success += res.successCount;
    failure += res.failureCount;
    res.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error?.code || "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        invalid.push(batch[idx]);
      }
    });
  }
  return { success, failure, invalid };
}

async function pruneInvalidTokens(tokens) {
  if (!tokens.length) return 0;
  const res = await FcmToken.deleteMany({ token: { $in: tokens } });
  return res.deletedCount ?? 0;
}

// ── Core cycle ────────────────────────────────────────────────────────────────
// Returns a summary object describing exactly what happened (for logs + admin UI).
async function runNotificationCycle({ force = false, trigger = "scheduled" } = {}) {
  const config = (await AdminConfig.findOne({})) || new AdminConfig();

  if (!config.notificationsEnabled) {
    return { ran: false, reason: "disabled" };
  }

  // Frequency gate — skip cheaply unless a digest is due (bypassed by test sends).
  if (!force && config.lastNotificationSentAt) {
    const elapsedMs = Date.now() - new Date(config.lastNotificationSentAt).getTime();
    const dueMs = config.notificationFrequencyDays * 24 * 60 * 60 * 1000;
    if (elapsedMs < dueMs) {
      return { ran: false, reason: "not-due", nextDueInDays: Math.ceil((dueMs - elapsedMs) / 86400000) };
    }
  }

  const blogs = await getTrendingUnsentBlogs(config.trendingBlogCount, config.trendingWindowDays);
  if (blogs.length === 0) {
    return { ran: false, reason: "no-new-content" };
  }

  // Only pull tokens once we know we have something to send.
  const tokenDocs = await FcmToken.find({ enabled: true }).select("token").lean();
  const tokens = tokenDocs.map((t) => t.token);
  if (tokens.length === 0) {
    return { ran: false, reason: "no-subscribers", blogs: blogs.length };
  }

  const message = buildDigestMessage(blogs);
  const { success, failure, invalid } = await sendToTokens(message, tokens);
  const pruned = await pruneInvalidTokens(invalid);

  // Mark these blogs notified (never re-sent) and stamp the cycle.
  await Blog.updateMany(
    { _id: { $in: blogs.map((b) => b._id) } },
    { $set: { digestNotifiedAt: new Date() } },
  );
  config.lastNotificationSentAt = new Date();
  await config.save();

  // Audit trail: record exactly what was delivered, to whom, and when.
  await NotificationLog.create({
    title: message.notification.title,
    body: message.notification.body,
    link: message.data.link,
    blogs: blogs.map((b) => ({ blogId: b._id, title: b.title, slug: b.slug })),
    recipients: tokens.length,
    success,
    failure,
    pruned,
    trigger,
    sentAt: new Date(),
  });

  const summary = { ran: true, blogs: blogs.length, recipients: tokens.length, success, failure, pruned };
  logger.info("Trending notification sent: " + JSON.stringify(summary));
  return summary;
}

// ── Test send ─────────────────────────────────────────────────────────────────
// Immediate test notification to an explicit list of tokens (e.g. the admin's own
// current browser). Never marks blogs notified, never touches the frequency gate.
async function sendTestToTokens(tokens) {
  const list = (tokens || []).filter(Boolean);
  if (list.length === 0) return { ok: false, reason: "no-tokens" };
  const message = {
    notification: { title: "🔔 Test notification", body: "Push notifications are working correctly." },
    webpush: {
      notification: {
        title: "🔔 Test notification",
        body: "Push notifications are working correctly.",
        icon: "/assets/logo128x128.png",
      },
      fcmOptions: { link: `${SITE_URL}/blogs` },
    },
    data: { link: `${SITE_URL}/blogs`, type: "test" },
  };
  const { success, failure, invalid } = await sendToTokens(message, list);
  const pruned = await pruneInvalidTokens(invalid);
  return { ok: success > 0, recipients: list.length, success, failure, pruned };
}

module.exports = { runNotificationCycle, sendTestToTokens };

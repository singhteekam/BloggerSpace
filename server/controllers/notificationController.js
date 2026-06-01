const FcmToken = require("../models/FcmToken");
const AdminConfig = require("../models/AdminConfig");
const NotificationLog = require("../models/NotificationLog");
const { runNotificationCycle, sendTestToTokens } = require("../services/notifications");
const logger = require("../utils/Logging/logs");

const ALLOWED_FREQUENCIES = [3, 7, 14];

// ── User: register / refresh this device's FCM token ──────────────────────────
exports.registerToken = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { token, userAgent = "" } = req.body;
    if (!userId) return res.status(401).json({ message: "Please login." });
    if (!token) return res.status(400).json({ message: "token required" });

    // Upsert by token. If the token previously belonged to another user (shared
    // device), reassign it to the current user and re-enable it.
    await FcmToken.findOneAndUpdate(
      { token },
      { token, userId, enabled: true, userAgent, lastUsedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json({ ok: true, enabled: true });
  } catch (error) {
    logger.error("registerToken error: " + error);
    res.status(500).json({ error: "Failed to register token" });
  }
};

// ── User: disable / remove this device's token ────────────────────────────────
exports.unregisterToken = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { token } = req.body;
    if (!userId) return res.status(401).json({ message: "Please login." });
    if (!token) return res.status(400).json({ message: "token required" });

    await FcmToken.deleteOne({ token, userId });
    res.json({ ok: true, enabled: false });
  } catch (error) {
    logger.error("unregisterToken error: " + error);
    res.status(500).json({ error: "Failed to unregister token" });
  }
};

// ── User: is this device's token currently registered? ────────────────────────
exports.tokenStatus = async (req, res) => {
  try {
    const userId = req.query.userId;
    const token = req.query.token;
    if (!userId) return res.status(401).json({ message: "Please login." });
    if (!token) return res.json({ enabled: false });
    const doc = await FcmToken.findOne({ token, userId, enabled: true }).select("_id").lean();
    res.json({ enabled: !!doc });
  } catch (error) {
    logger.error("tokenStatus error: " + error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
};

// ── Admin: read notification config + live stats ──────────────────────────────
exports.getNotificationConfig = async (req, res) => {
  try {
    const config = (await AdminConfig.findOne({}).lean()) || {};
    const subscriberCount = await FcmToken.countDocuments({ enabled: true });
    res.json({
      notificationsEnabled: config.notificationsEnabled ?? false,
      notificationFrequencyDays: config.notificationFrequencyDays ?? 7,
      trendingBlogCount: config.trendingBlogCount ?? 3,
      lastNotificationSentAt: config.lastNotificationSentAt ?? null,
      subscriberCount,
    });
  } catch (error) {
    logger.error("getNotificationConfig error: " + error);
    res.status(500).json({ error: "Failed to fetch notification config" });
  }
};

// ── Admin: update notification config ─────────────────────────────────────────
exports.updateNotificationConfig = async (req, res) => {
  try {
    const { notificationsEnabled, notificationFrequencyDays, trendingBlogCount } = req.body;

    const config = (await AdminConfig.findOne({})) || new AdminConfig();

    if (typeof notificationsEnabled === "boolean") {
      config.notificationsEnabled = notificationsEnabled;
    }
    if (notificationFrequencyDays !== undefined) {
      const freq = Number(notificationFrequencyDays);
      if (!ALLOWED_FREQUENCIES.includes(freq)) {
        return res.status(400).json({ message: `Frequency must be one of: ${ALLOWED_FREQUENCIES.join(", ")} days` });
      }
      config.notificationFrequencyDays = freq;
    }
    if (trendingBlogCount !== undefined) {
      const count = Number(trendingBlogCount);
      if (!Number.isInteger(count) || count < 1 || count > 10) {
        return res.status(400).json({ message: "Trending blog count must be between 1 and 10" });
      }
      config.trendingBlogCount = count;
    }
    config.updatedAt = new Date();
    config.updatedBy = req.query.userId || null;
    await config.save();

    res.json({
      message: "Notification settings updated.",
      notificationsEnabled: config.notificationsEnabled,
      notificationFrequencyDays: config.notificationFrequencyDays,
      trendingBlogCount: config.trendingBlogCount,
      lastNotificationSentAt: config.lastNotificationSentAt ?? null,
    });
  } catch (error) {
    logger.error("updateNotificationConfig error: " + error);
    res.status(500).json({ error: "Failed to update notification config" });
  }
};

// ── Admin: send a test notification to the admin's own browser token ──────────
exports.sendTestNotification = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Provide your current browser token to test." });
    const result = await sendTestToTokens([token]);
    if (!result.ok) return res.status(400).json({ message: "Test failed — token may be invalid.", ...result });
    res.json({ message: "Test notification sent.", ...result });
  } catch (error) {
    logger.error("sendTestNotification error: " + error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
};

// ── Admin: manually trigger a digest run now (respects dedup; force-bypasses gate)
exports.triggerNotificationRun = async (req, res) => {
  try {
    const result = await runNotificationCycle({ force: true, trigger: "manual" });
    res.json({ message: "Notification cycle executed.", ...result });
  } catch (error) {
    logger.error("triggerNotificationRun error: " + error);
    res.status(500).json({ error: "Failed to run notification cycle" });
  }
};

// ── Admin: paginated history of sent notifications (what was delivered, when) ──
exports.getNotificationHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      NotificationLog.find({}).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationLog.countDocuments({}),
    ]);
    res.json({ logs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    logger.error("getNotificationHistory error: " + error);
    res.status(500).json({ error: "Failed to fetch notification history" });
  }
};

const mongoose = require("mongoose");

const IST_OFFSET = 330;

// Singleton config document. Every knob the admin can tune lives here.
// Read via `AdminConfig.findOne({}) ?? new AdminConfig()` so defaults apply
// even if no document has been created yet.
const adminConfigSchema = new mongoose.Schema({
  // ── Redemption ──────────────────────────────────────────────
  // gem value in PAISE (integer) to avoid floating-point issues.
  // 50 paise = ₹0.50 per gem => 2 gems = ₹1.
  gemValuePaise: { type: Number, default: 50, min: 1 },
  minRedeemGems: { type: Number, default: 200, min: 1 },
  maxRedeemGems: { type: Number, default: 2000, min: 1 },
  redemptionCooldownDays: { type: Number, default: 7, min: 0 },
  newAccountFlagDays: { type: Number, default: 7, min: 0 },
  redemptionMethods: {
    type: [String],
    default: ["AMAZON_GIFT_CARD", "FLIPKART_GIFT_CARD"],
  },

  // ── Admin gem grants ────────────────────────────────────────
  minGrantGems: { type: Number, default: 0, min: 0 },
  maxGrantGems: { type: Number, default: 100, min: 1 },
  grantReverseWindowHours: { type: Number, default: 24, min: 0 },

  // ── Per-blog gem caps ───────────────────────────────────────
  perBlogAuthorGemsCap: { type: Number, default: 10, min: 0 },
  perBlogReviewerGemsCap: { type: Number, default: 5, min: 0 },

  // ── Scoring ─────────────────────────────────────────────────
  maxBlogScore: { type: Number, default: 10, min: 1 },

  // ── Periodic re-verification ────────────────────────────────────
  // Days before an Email-auth user must re-verify. OAuth users auto-refresh on login.
  reverificationPeriodDays: { type: Number, default: 30, min: 1 },

  // Maintenance mode moved to the MAINTENANCE_MODE env var (frontend middleware).

  // ── Visitor analytics ───────────────────────────────────────────
  // Master switch for visitor tracking (VisitorLog). When false, no page views
  // are recorded (saves Firebase function invocations + Mongo writes). Default on.
  analyticsEnabled: { type: Boolean, default: true },

  // ── Push notifications (trending-blog digest via FCM) ───────────
  notificationsEnabled: { type: Boolean, default: false },
  // Minimum days between digests. Admin picks 3, 7, or 14 (validated in controller).
  notificationFrequencyDays: { type: Number, default: 7, min: 1 },
  // How many trending blogs to include in each digest.
  trendingBlogCount: { type: Number, default: 3, min: 1, max: 10 },
  // "Recently published" window the trending query looks back over.
  trendingWindowDays: { type: Number, default: 30, min: 1 },
  // Timestamp of the last digest actually sent — drives the frequency gate.
  lastNotificationSentAt: { type: Date, default: null },

  // ── Audit ───────────────────────────────────────────────────
  updatedAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },
});

module.exports = mongoose.model("AdminConfig", adminConfigSchema);

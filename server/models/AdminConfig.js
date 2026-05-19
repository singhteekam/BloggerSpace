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

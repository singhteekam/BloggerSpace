const AdminConfig = require("../../models/AdminConfig");

const IST_OFFSET = 330;

// Fields the admin can update via PATCH. Any other key in the body is ignored.
const EDITABLE_FIELDS = [
  // Redemption
  "gemValuePaise",
  "minRedeemGems",
  "maxRedeemGems",
  "redemptionCooldownDays",
  "newAccountFlagDays",
  "redemptionMethods",
  // Grants
  "minGrantGems",
  "maxGrantGems",
  "grantReverseWindowHours",
  // Per-blog caps
  "perBlogAuthorGemsCap",
  "perBlogReviewerGemsCap",
  // Scoring
  "maxBlogScore",
];

const VALID_REDEMPTION_METHODS = ["AMAZON_GIFT_CARD", "FLIPKART_GIFT_CARD"];

/**
 * GET /api/admin/config
 * Returns the singleton config document. Creates one with defaults if none exists.
 */
exports.getAdminConfig = async (req, res) => {
  try {
    let config = await AdminConfig.findOne({}).lean();
    if (!config) {
      const created = await AdminConfig.create({});
      config = created.toObject();
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch config", error: error.message });
  }
};

/**
 * PATCH /api/admin/config
 * Updates the singleton config. Only whitelisted fields are accepted.
 * Validates cross-field invariants (min <= max for both redeem and grant).
 */
exports.updateAdminConfig = async (req, res) => {
  try {
    const updates = {};
    for (const key of EDITABLE_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No editable fields provided" });
    }

    // Number-field coercion (frontend may send strings from <input>).
    const numberFields = EDITABLE_FIELDS.filter((f) => f !== "redemptionMethods");
    for (const f of numberFields) {
      if (updates[f] !== undefined) {
        const n = Number(updates[f]);
        if (!Number.isFinite(n) || n < 0) {
          return res.status(400).json({ message: `Invalid value for ${f}` });
        }
        updates[f] = n;
      }
    }

    // Validate redemptionMethods array
    if (updates.redemptionMethods !== undefined) {
      if (!Array.isArray(updates.redemptionMethods) || updates.redemptionMethods.length === 0) {
        return res.status(400).json({ message: "At least one redemption method required" });
      }
      for (const m of updates.redemptionMethods) {
        if (!VALID_REDEMPTION_METHODS.includes(m)) {
          return res.status(400).json({ message: `Unsupported redemption method: ${m}` });
        }
      }
    }

    // Load current values to validate min <= max invariants after merge.
    const current = (await AdminConfig.findOne({}).lean()) ?? {};
    const merged = { ...current, ...updates };

    if (merged.minRedeemGems > merged.maxRedeemGems) {
      return res.status(400).json({ message: "minRedeemGems must be ≤ maxRedeemGems" });
    }
    if (merged.minGrantGems > merged.maxGrantGems) {
      return res.status(400).json({ message: "minGrantGems must be ≤ maxGrantGems" });
    }

    updates.updatedAt = new Date(new Date().getTime() + IST_OFFSET * 60000);
    updates.updatedBy = req.query.userId || null;

    const updated = await AdminConfig.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update config", error: error.message });
  }
};

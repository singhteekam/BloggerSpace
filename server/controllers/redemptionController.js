/**
 * Phase 4 — gem redemption flow.
 *
 * User-facing handlers (require `authenticate` middleware):
 *   - createRedemption    POST /api/redemptions
 *   - listOwnRedemptions  GET  /api/redemptions/me
 *
 * Admin-facing handlers (require `adminMiddleware`):
 *   - listAllRedemptions  GET    /api/admin/redemptions
 *   - fulfillRedemption   PATCH  /api/admin/redemptions/:id/fulfill
 *   - rejectRedemption    PATCH  /api/admin/redemptions/:id/reject
 *
 * Atomicity guarantee:
 *   Creating a request and deducting gems happens in a single Mongo
 *   transaction via the gemsLedger helper. Rejecting a request and
 *   refunding gems also happens in a single transaction. This makes
 *   the "user balance" + "ledger" + "redemption request" trio always
 *   consistent — there's no window where gems are missing from the
 *   balance but no request exists, or vice versa.
 */

const mongoose = require("mongoose");
const RedemptionRequest = require("../models/RedemptionRequest");
const User = require("../models/User");
const AdminConfig = require("../models/AdminConfig");
const { deductGems, awardGems } = require("../utils/gemsLedger");
const sendEmail = require("../services/mailer");

const IST_OFFSET = 330;
const istNow = () => new Date(new Date().getTime() + IST_OFFSET * 60000);

// Defaults if AdminConfig is missing (defensive — Phase 1 lazily creates it).
const DEFAULTS = {
  gemValuePaise: 50,
  minRedeemGems: 200,
  maxRedeemGems: 2000,
  redemptionCooldownDays: 7,
  newAccountFlagDays: 7,
};

async function loadConfig() {
  const cfg = (await AdminConfig.findOne({}).lean()) ?? {};
  return {
    gemValuePaise: cfg.gemValuePaise ?? DEFAULTS.gemValuePaise,
    minRedeemGems: cfg.minRedeemGems ?? DEFAULTS.minRedeemGems,
    maxRedeemGems: cfg.maxRedeemGems ?? DEFAULTS.maxRedeemGems,
    redemptionCooldownDays: cfg.redemptionCooldownDays ?? DEFAULTS.redemptionCooldownDays,
    newAccountFlagDays: cfg.newAccountFlagDays ?? DEFAULTS.newAccountFlagDays,
  };
}

// ─── User: create redemption request ─────────────────────────────────────────
exports.createRedemption = async (req, res) => {
  const userId = req.query.userId; // set by authenticate middleware
  const { amount } = req.body;

  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const amt = parseInt(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: "amount must be a positive integer" });
  }

  const cfg = await loadConfig();

  if (amt < cfg.minRedeemGems || amt > cfg.maxRedeemGems) {
    return res.status(400).json({
      error: `Amount must be between ${cfg.minRedeemGems} and ${cfg.maxRedeemGems} gems`,
    });
  }

  const user = await User.findById(userId)
    .select("fullName userName email isVerified status gems createdAt")
    .lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.status === "INACTIVE") {
    return res.status(403).json({ error: "Your account is inactive." });
  }
  if (!user.isVerified) {
    return res.status(403).json({ error: "Please verify your email before redeeming." });
  }
  if ((user.gems ?? 0) < amt) {
    return res.status(400).json({ error: "Insufficient gems balance" });
  }

  // Block if a PENDING request already exists for this user
  const existingPending = await RedemptionRequest.findOne({ userId, status: "PENDING" }).lean();
  if (existingPending) {
    return res.status(409).json({
      error: "You already have a pending redemption request. Wait for it to be processed.",
    });
  }

  // Cooldown: reject if last FULFILLED request was within `redemptionCooldownDays`
  if (cfg.redemptionCooldownDays > 0) {
    const cooldownMs = cfg.redemptionCooldownDays * 24 * 60 * 60 * 1000;
    const lastFulfilled = await RedemptionRequest.findOne({
      userId,
      status: "FULFILLED",
    }).sort({ fulfilledAt: -1 }).select("fulfilledAt").lean();
    if (lastFulfilled?.fulfilledAt) {
      const since = Date.now() - new Date(lastFulfilled.fulfilledAt).getTime();
      if (since < cooldownMs) {
        const daysLeft = Math.ceil((cooldownMs - since) / (24 * 60 * 60 * 1000));
        return res.status(429).json({
          error: `Cooldown active. Try again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        });
      }
    }
  }

  // Flag account if too new (admin review required, but request still goes through)
  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  const flagThresholdMs = cfg.newAccountFlagDays * 24 * 60 * 60 * 1000;
  const isFlagged = cfg.newAccountFlagDays > 0 && ageMs < flagThresholdMs;
  const flagReason = isFlagged
    ? `Account created less than ${cfg.newAccountFlagDays} days ago`
    : "";

  const valueInPaise = amt * cfg.gemValuePaise;

  // ── Atomic: deduct gems + create request in single Mongo transaction ──
  const session = await mongoose.startSession();
  let createdRequest = null;
  let newBalance = null;

  try {
    await session.withTransaction(async () => {
      // Deduct gems (uses $gte guard internally — throws if insufficient)
      const { balance, txn } = await deductGems({
        userId,
        amount: amt,
        source: "REDEMPTION_DEDUCT",
        awardedBy: userId, // user-initiated
        note: `Redemption request (${cfg.gemValuePaise} paise/gem = ₹${(valueInPaise / 100).toFixed(2)})`,
        session,
      });
      newBalance = balance;

      // Create the request, linking to the deduction txn
      const [doc] = await RedemptionRequest.create(
        [{
          userId,
          gemsAmount: amt,
          valueInPaise,
          method: "AMAZON_GIFT_CARD",
          recipientEmail: user.email,
          status: "PENDING",
          isFlagged,
          flagReason,
          deductTxnId: txn._id,
          createdAt: istNow(),
        }],
        { session },
      );
      createdRequest = doc;

      // Back-link the txn to the redemption request for audit
      const GemsTransaction = require("../models/GemsTransaction");
      await GemsTransaction.updateOne(
        { _id: txn._id },
        { $set: { redemptionRequestId: doc._id } },
        { session },
      );
    });
  } catch (err) {
    if (err.code === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({ error: "Insufficient gems balance" });
    }
    console.error("[createRedemption] transaction failed:", err);
    return res.status(500).json({ error: "Failed to create redemption request" });
  } finally {
    session.endSession();
  }

  return res.status(201).json({
    message: "Redemption request submitted",
    balance: newBalance,
    request: createdRequest,
  });
};

// ─── User: list own redemption history ───────────────────────────────────────
// Also returns the user-relevant redemption config (rate, min, max) so the
// UI can show "₹X per gem", "minimum N gems", etc. without needing admin access.
exports.listOwnRedemptions = async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const cfg = await loadConfig();

    const [requests, total, pendingCount, hasFulfilled] = await Promise.all([
      RedemptionRequest.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RedemptionRequest.countDocuments({ userId }),
      RedemptionRequest.countDocuments({ userId, status: "PENDING" }),
      RedemptionRequest.findOne({ userId, status: "FULFILLED" })
        .sort({ fulfilledAt: -1 })
        .select("fulfilledAt")
        .lean(),
    ]);

    // Compute remaining cooldown (days) for the UI
    let cooldownDaysLeft = 0;
    if (cfg.redemptionCooldownDays > 0 && hasFulfilled?.fulfilledAt) {
      const since = Date.now() - new Date(hasFulfilled.fulfilledAt).getTime();
      const cooldownMs = cfg.redemptionCooldownDays * 24 * 60 * 60 * 1000;
      if (since < cooldownMs) {
        cooldownDaysLeft = Math.ceil((cooldownMs - since) / (24 * 60 * 60 * 1000));
      }
    }

    res.json({
      requests,
      total,
      pendingCount,
      cooldownDaysLeft,
      page,
      pages: Math.ceil(total / limit),
      // Public subset of redemption config for the user UI
      config: {
        gemValuePaise: cfg.gemValuePaise,
        minRedeemGems: cfg.minRedeemGems,
        maxRedeemGems: cfg.maxRedeemGems,
        redemptionCooldownDays: cfg.redemptionCooldownDays,
        methods: ["AMAZON_GIFT_CARD"],
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch redemption history" });
  }
};

// ─── Admin: list all redemption requests with status filter ───────────────────
exports.listAllRedemptions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;
    const status = req.query.status || null; // 'PENDING' | 'FULFILLED' | 'REJECTED' | null
    const filter = {};
    if (status) filter.status = status;

    const [requests, total, pendingCount] = await Promise.all([
      RedemptionRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName userName email gems createdAt isVerified")
        .populate("fulfilledBy", "fullName email")
        .populate("rejectedBy", "fullName email")
        .lean(),
      RedemptionRequest.countDocuments(filter),
      RedemptionRequest.countDocuments({ status: "PENDING" }),
    ]);

    res.json({
      requests,
      total,
      pendingCount,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch redemption requests" });
  }
};

// ─── Admin: mark request as FULFILLED ─────────────────────────────────────────
exports.fulfillRedemption = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const adminId = req.query.userId;

  try {
    const request = await RedemptionRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "PENDING") {
      return res.status(409).json({ error: `Request already ${request.status.toLowerCase()}` });
    }

    request.status = "FULFILLED";
    request.fulfilledAt = istNow();
    request.fulfilledBy = adminId;
    request.fulfillmentNote = (note ?? "").toString().trim().slice(0, 500);
    await request.save();

    // Best-effort email to user
    const user = await User.findById(request.userId).select("email fullName userName").lean();
    if (user?.email) {
      sendEmail(
        user.email,
        `Your redemption has been fulfilled — ${request.gemsAmount} gems`,
        `<div class="content">
          <h2>Your redemption is on its way!</h2>
          <p>Hi ${user.fullName || user.userName || "there"},</p>
          <p>We've sent your <b>Amazon gift card worth ₹${(request.valueInPaise / 100).toFixed(2)}</b> to <b>${request.recipientEmail}</b>. Please check your inbox (and spam folder) shortly.</p>
          ${request.fulfillmentNote ? `<p style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px;margin:16px 0;"><b>Note from admin:</b><br/>${escapeHtml(request.fulfillmentNote)}</p>` : ""}
          <p>Thank you for being part of BloggerSpace!</p>
        </div>`
      ).catch((e) => console.error("[fulfillRedemption] email send failed:", e?.message));
    }

    res.json({ message: "Marked as fulfilled", request });
  } catch (error) {
    console.error("Error fulfilling redemption:", error);
    res.status(500).json({ error: "Failed to fulfill request" });
  }
};

// ─── Admin: reject request and atomically refund the gems ─────────────────────
exports.rejectRedemption = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.query.userId;

  try {
    const request = await RedemptionRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "PENDING") {
      return res.status(409).json({ error: `Request already ${request.status.toLowerCase()}` });
    }

    const cleanReason = (reason ?? "").toString().trim().slice(0, 500);

    // Atomic: refund gems + mark request rejected
    const session = await mongoose.startSession();
    let refundTxn = null;
    try {
      await session.withTransaction(async () => {
        const { txn } = await awardGems({
          userId: request.userId,
          amount: request.gemsAmount,
          source: "REDEMPTION_REFUND",
          awardedBy: adminId,
          note: cleanReason || "Redemption rejected — gems refunded",
          redemptionRequestId: request._id,
          session,
        });
        refundTxn = txn;

        request.status = "REJECTED";
        request.rejectedAt = istNow();
        request.rejectedBy = adminId;
        request.rejectionReason = cleanReason;
        request.refundTxnId = txn._id;
        await request.save({ session });
      });
    } finally {
      session.endSession();
    }

    // Best-effort email
    const user = await User.findById(request.userId).select("email fullName userName").lean();
    if (user?.email) {
      sendEmail(
        user.email,
        `Your redemption request was not approved`,
        `<div class="content">
          <h2>Redemption request update</h2>
          <p>Hi ${user.fullName || user.userName || "there"},</p>
          <p>Your request to redeem <b>${request.gemsAmount} gems</b> was not approved. The gems have been refunded to your balance.</p>
          ${cleanReason ? `<p style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px;margin:16px 0;"><b>Reason:</b><br/>${escapeHtml(cleanReason)}</p>` : ""}
          <p>If you think this was a mistake, please contact support.</p>
        </div>`
      ).catch((e) => console.error("[rejectRedemption] email send failed:", e?.message));
    }

    res.json({ message: "Request rejected and gems refunded", request, refundTransaction: refundTxn });
  } catch (error) {
    console.error("Error rejecting redemption:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

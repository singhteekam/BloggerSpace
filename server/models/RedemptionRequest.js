const mongoose = require("mongoose");

const IST_OFFSET = 330;

/**
 * A user-initiated request to redeem gems for an Amazon gift card (Phase 4).
 *
 * Lifecycle: PENDING → FULFILLED (admin manually sent gift card)
 *                    └→ REJECTED  (gems automatically refunded)
 *
 * Critical invariant: when a request is created with status PENDING, the
 * gems are ALREADY deducted from the user's balance via an atomic Mongo
 * transaction. The deductTxnId field links to that ledger entry. On reject,
 * a refund ledger entry is created and linked via refundTxnId. This means:
 *   - a user cannot "double-redeem" the same gems — they're physically gone
 *     from the balance the moment the request exists
 *   - rejecting a request always restores the exact amount that was deducted
 *   - the audit trail (GemsTransaction rows) reads top-to-bottom and matches
 *     the request lifecycle
 */
const redemptionRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

  gemsAmount: { type: Number, required: true, min: 1 },
  // Snapshot of the gem-to-paise rate from AdminConfig AT REQUEST TIME so
  // later admin changes to the rate don't retroactively change a user's
  // entitled value.
  valueInPaise: { type: Number, required: true, min: 1 },

  method: {
    type: String,
    enum: ["AMAZON_GIFT_CARD"],
    required: true,
    default: "AMAZON_GIFT_CARD",
  },
  // Where the admin should send the gift card. Captured at request time so
  // a later email change on the User doc doesn't affect a pending request.
  recipientEmail: { type: String, required: true },

  status: {
    type: String,
    enum: ["PENDING", "FULFILLED", "REJECTED"],
    default: "PENDING",
    index: true,
  },

  // Flag for admin attention. Set when account is younger than newAccountFlagDays.
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String, default: "" },

  // Ledger linkage — required (we always create the deduct txn alongside).
  deductTxnId: { type: mongoose.Schema.Types.ObjectId, ref: "GemsTransaction", required: true },

  // Fulfillment fields (set when admin marks FULFILLED)
  fulfilledAt: { type: Date, default: null },
  fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: "admins", default: null },
  fulfillmentNote: { type: String, default: "" },

  // Rejection fields (set when admin marks REJECTED)
  rejectedAt: { type: Date, default: null },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "admins", default: null },
  rejectionReason: { type: String, default: "" },
  refundTxnId: { type: mongoose.Schema.Types.ObjectId, ref: "GemsTransaction", default: null },

  createdAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

// Compound index for the most frequent query: "any PENDING request for this user?"
redemptionRequestSchema.index({ userId: 1, status: 1 });
// For admin pagination of pending queue by recency
redemptionRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("RedemptionRequest", redemptionRequestSchema);

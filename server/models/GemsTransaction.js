const mongoose = require("mongoose");

const IST_OFFSET = 330;

// NOTE on safe migration with existing rows:
// - `blogId` and `role` were `required: true` in the original schema. All
//   existing rows in production have them set (they were blog awards).
//   Loosening to `required: false` does NOT invalidate existing rows.
// - `source` is new with a default of `BLOG_AWARD`. Old rows that don't have
//   the field read back as `BLOG_AWARD` via Mongoose's default, which is what
//   they were. No backfill / migration script is needed.
const gemsTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

  // Blog context — set only for BLOG_AWARD transactions. Optional now so
  // ADMIN_GRANT / REDEMPTION_* transactions can be stored in the same ledger.
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: false },
  blogTitle: { type: String, default: "" },
  blogSlug: { type: String, default: "" },

  type: { type: String, enum: ["AWARD", "DEDUCT"], required: true },

  // Role only meaningful for blog awards. Optional for non-blog transactions.
  role: { type: String, enum: ["AUTHOR", "REVIEWER"], required: false },

  amount: { type: Number, required: true },
  awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

  // What caused this ledger entry. Drives downstream handling / UI labels.
  source: {
    type: String,
    enum: [
      "BLOG_AWARD",          // admin awards gems on blog approval
      "ADMIN_GRANT",         // admin grants gems with appreciation note
      "ADMIN_GRANT_REVERSE", // admin reverses a previous grant within window
      "REDEMPTION_DEDUCT",   // user submits redemption request
      "REDEMPTION_REFUND",   // admin rejects redemption -> gems returned
    ],
    default: "BLOG_AWARD",
  },

  // Free-text note from admin (appreciation message for grants, reason for
  // reversals, fulfillment notes for redemptions, etc.). Visible to user.
  note: { type: String, default: "" },

  // Audit links — set when this txn was created as a reversal of another,
  // or when it belongs to a redemption request. Both nullable.
  reversedByTxnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GemsTransaction",
    default: null,
  },
  redemptionRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RedemptionRequest",
    default: null,
  },

  createdAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

// Useful read paths: user history, redemption-linked txns, blog-tied txns.
gemsTransactionSchema.index({ userId: 1, createdAt: -1 });
gemsTransactionSchema.index({ redemptionRequestId: 1 });
gemsTransactionSchema.index({ blogId: 1 });

module.exports = mongoose.model("GemsTransaction", gemsTransactionSchema);

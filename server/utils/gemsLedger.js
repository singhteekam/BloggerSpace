/**
 * Atomic gem ledger helpers.
 *
 * ALL gem balance changes in the codebase MUST go through these helpers.
 * Controllers must never `$inc` `users.gems` directly — that bypasses the
 * audit trail and risks race conditions on concurrent requests.
 *
 * Each helper:
 *   1. Mutates `users.gems` atomically (single Mongo op with `$gte` guard
 *      for deductions, so a race can't push the balance negative).
 *   2. Inserts a `GemsTransaction` row capturing the change.
 *   3. Optionally participates in a Mongo session (transaction) so the
 *      caller can wrap multi-document operations atomically — e.g. creating
 *      a `RedemptionRequest` + deducting gems together.
 *
 * Returns `{ balance, txn }` on success. Throws on failure (caller decides
 * how to surface to the user; controllers typically map to 400/409).
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const GemsTransaction = require("../models/GemsTransaction");

const VALID_SOURCES = [
  "BLOG_AWARD",
  "ADMIN_GRANT",
  "ADMIN_GRANT_REVERSE",
  "REDEMPTION_DEDUCT",
  "REDEMPTION_REFUND",
];

function assertPositiveInt(amount, label = "amount") {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive integer (got ${amount})`);
  }
}

function assertValidSource(source) {
  if (!VALID_SOURCES.includes(source)) {
    throw new Error(`Invalid gems source: ${source}`);
  }
}

/**
 * Atomically credit gems to a user and record the transaction.
 *
 * @param {object} opts
 * @param {ObjectId|string} opts.userId        Recipient.
 * @param {number}          opts.amount        Positive integer.
 * @param {string}          opts.source        One of VALID_SOURCES.
 * @param {ObjectId|string} opts.awardedBy     Actor (admin or user id).
 * @param {ObjectId|string} [opts.blogId]      For BLOG_AWARD only.
 * @param {string}          [opts.blogTitle]
 * @param {string}          [opts.blogSlug]
 * @param {"AUTHOR"|"REVIEWER"} [opts.role]    For BLOG_AWARD only.
 * @param {string}          [opts.note]
 * @param {ObjectId|string} [opts.redemptionRequestId]
 * @param {mongoose.ClientSession} [opts.session]
 * @returns {Promise<{balance:number, txn:object}>}
 */
async function awardGems(opts) {
  const {
    userId, amount, source, awardedBy,
    blogId, blogTitle, blogSlug, role,
    note, redemptionRequestId, session,
  } = opts;

  assertPositiveInt(amount, "amount");
  assertValidSource(source);
  if (!userId) throw new Error("userId required");
  if (!awardedBy) throw new Error("awardedBy required");

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { gems: amount } },
    { new: true, session },
  ).select("gems").lean();

  if (!updatedUser) throw new Error("User not found");

  const [txn] = await GemsTransaction.create(
    [{
      userId,
      blogId: blogId ?? undefined,
      blogTitle: blogTitle ?? "",
      blogSlug: blogSlug ?? "",
      type: "AWARD",
      role: role ?? undefined,
      amount,
      awardedBy,
      source,
      note: note ?? "",
      redemptionRequestId: redemptionRequestId ?? null,
    }],
    { session },
  );

  return { balance: updatedUser.gems, txn };
}

/**
 * Atomically debit gems from a user and record the transaction.
 * Uses `$gte` guard — if the balance is insufficient, returns null and we
 * throw an INSUFFICIENT_BALANCE error before touching the ledger.
 *
 * @param {object} opts  Same shape as awardGems (blog fields rarely set).
 * @returns {Promise<{balance:number, txn:object}>}
 * @throws  Error with `.code === "INSUFFICIENT_BALANCE"` if balance too low.
 */
async function deductGems(opts) {
  const {
    userId, amount, source, awardedBy,
    blogId, blogTitle, blogSlug, role,
    note, redemptionRequestId, session,
  } = opts;

  assertPositiveInt(amount, "amount");
  assertValidSource(source);
  if (!userId) throw new Error("userId required");
  if (!awardedBy) throw new Error("awardedBy required");

  // Conditional decrement: only succeeds if user has enough gems.
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, gems: { $gte: amount } },
    { $inc: { gems: -amount } },
    { new: true, session },
  ).select("gems").lean();

  if (!updatedUser) {
    const err = new Error("Insufficient gems balance");
    err.code = "INSUFFICIENT_BALANCE";
    throw err;
  }

  const [txn] = await GemsTransaction.create(
    [{
      userId,
      blogId: blogId ?? undefined,
      blogTitle: blogTitle ?? "",
      blogSlug: blogSlug ?? "",
      type: "DEDUCT",
      role: role ?? undefined,
      amount,
      awardedBy,
      source,
      note: note ?? "",
      redemptionRequestId: redemptionRequestId ?? null,
    }],
    { session },
  );

  return { balance: updatedUser.gems, txn };
}

/**
 * Reverse a previous AWARD transaction. Creates a paired DEDUCT entry with
 * source ADMIN_GRANT_REVERSE, deducts the same amount from the user, and
 * sets `reversedByTxnId` on both rows so the audit trail links cleanly.
 *
 * Intended for admin grant typos / wrong-user mistakes within the configured
 * reversal window. The caller (controller) is responsible for enforcing the
 * window — this helper just performs the atomic reversal.
 *
 * @param {object} opts
 * @param {ObjectId|string} opts.txnId        Original AWARD txn to reverse.
 * @param {ObjectId|string} opts.reversedBy   Admin performing the reversal.
 * @param {string}          [opts.reason]
 * @param {mongoose.ClientSession} [opts.session]
 * @returns {Promise<{balance:number, reverseTxn:object, originalTxn:object}>}
 */
async function reverseTransaction(opts) {
  const { txnId, reversedBy, reason, session } = opts;
  if (!txnId) throw new Error("txnId required");
  if (!reversedBy) throw new Error("reversedBy required");

  const original = await GemsTransaction.findById(txnId).session(session ?? null);
  if (!original) throw new Error("Original transaction not found");
  if (original.type !== "AWARD") {
    throw new Error("Only AWARD transactions can be reversed");
  }
  if (original.reversedByTxnId) {
    throw new Error("This transaction was already reversed");
  }

  // Deduct the same amount. We don't use deductGems() here because we want
  // to allow the balance to dip below zero if necessary (e.g., user already
  // spent the granted gems). Negative balances are caught when displayed or
  // when the user next tries to redeem — the audit trail stays correct.
  const updatedUser = await User.findByIdAndUpdate(
    original.userId,
    { $inc: { gems: -original.amount } },
    { new: true, session },
  ).select("gems").lean();

  if (!updatedUser) throw new Error("User not found");

  const [reverseTxn] = await GemsTransaction.create(
    [{
      userId: original.userId,
      type: "DEDUCT",
      amount: original.amount,
      awardedBy: reversedBy,
      source: "ADMIN_GRANT_REVERSE",
      note: reason ?? "",
      reversedByTxnId: original._id,
    }],
    { session },
  );

  original.reversedByTxnId = reverseTxn._id;
  await original.save({ session });

  return { balance: updatedUser.gems, reverseTxn, originalTxn: original };
}

module.exports = {
  awardGems,
  deductGems,
  reverseTransaction,
  VALID_SOURCES,
};

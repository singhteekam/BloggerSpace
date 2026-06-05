// Mongo-backed rate limiter.
//
// Why not express-rate-limit's in-memory store? Firebase Functions / Cloud Run scale
// to many instances, each with its own memory, so an attacker's requests spread across
// instances and an in-memory counter barely limits anything. A shared Mongo counter is
// consistent across every instance. A small read-then-write race can slightly over-count
// under heavy concurrency — fine for rate limiting — and the limiter FAILS OPEN if Mongo
// errors, so it can never lock real users out due to an infra hiccup.

const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
// TTL cleanup — Mongo removes the doc once the window is over.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit =
  mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);

const clientIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.ip ||
  req.connection?.remoteAddress ||
  "unknown";

/**
 * rateLimit({ windowMs, max, name, message })
 *   windowMs — window length in ms
 *   max      — max requests per IP per window (within this `name` bucket)
 *   name     — bucket label (limiters with the same name share a counter per IP)
 */
function rateLimit({ windowMs, max, name = "rl", message } = {}) {
  return async (req, res, next) => {
    try {
      const key = `${name}:${clientIp(req)}`;
      const now = Date.now();

      const existing = await RateLimit.findOne({ key }).lean();
      if (!existing || new Date(existing.expiresAt).getTime() <= now) {
        // Fresh window.
        await RateLimit.updateOne(
          { key },
          { $set: { count: 1, expiresAt: new Date(now + windowMs) } },
          { upsert: true },
        ).catch(() => {});
        return next();
      }

      const doc = await RateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 } },
        { new: true },
      );
      if (doc && doc.count > max) {
        const retry = Math.max(1, Math.ceil((new Date(doc.expiresAt).getTime() - now) / 1000));
        res.set("Retry-After", String(retry));
        return res
          .status(429)
          .json({ error: message || "Too many requests. Please try again in a few minutes." });
      }
      return next();
    } catch (_e) {
      // Fail open — never block legitimate users because the limiter errored.
      return next();
    }
  };
}

// Ready-made limiters (15-minute windows).
// OTP/email senders are tighter (each call sends an email = abuse + cost vector).
const otpLimiter = rateLimit({
  name: "otp",
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Too many code requests. Please wait a few minutes and try again.",
});
const authLimiter = rateLimit({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

module.exports = { rateLimit, otpLimiter, authLimiter };

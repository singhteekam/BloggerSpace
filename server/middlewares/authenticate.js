const jwt = require("jsonwebtoken");
const logger = require("./../utils/Logging/logs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const AdminConfig = require("../models/AdminConfig");

// Cache AdminConfig for 60 seconds to avoid a DB hit on every request
let configCache = { value: null, expiresAt: 0 };
async function getReverificationPeriod() {
  if (configCache.value && Date.now() < configCache.expiresAt) {
    return configCache.value;
  }
  const config = await AdminConfig.findOne({}).lean();
  const period = config?.reverificationPeriodDays ?? 30;
  configCache = { value: period, expiresAt: Date.now() + 60_000 };
  return period;
}

// Shared gate: deactivation + periodic re-verification. Used by both the
// current and legacy JWT paths so neither can bypass the check.
// Returns true if the request was already handled (response sent); caller stops.
async function enforceUserGate(userId, res) {
  const user = await User.findById(userId)
    .select("status authType lastVerifiedAt")
    .lean();
  if (!user || user.status === "DELETED") {
    res.status(401).json({ message: "Account deleted." });
    return true;
  }
  if (user.status === "INACTIVE") {
    res.status(401).json({ message: "Account deactivated. Please contact support." });
    return true;
  }

  const periodDays = await getReverificationPeriod();
  const lastVerified = user.lastVerifiedAt;
  const daysSince = lastVerified
    ? (Date.now() - new Date(lastVerified).getTime()) / 86_400_000
    : Infinity;

  if (daysSince > periodDays) {
    if (user.authType === "Email" || !user.authType) {
      res.status(403).json({
        code: "REVERIFICATION_REQUIRED",
        message: "Periodic re-verification required. Please verify your account.",
      });
      return true;
    }
    // OAuth users — silently refresh lastVerifiedAt (OAuth itself is verification)
    await User.findByIdAndUpdate(userId, { lastVerifiedAt: new Date() });
  }
  return false;
}

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    // Try CURRENT_JWT_SECRET first (new unified tokens)
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);

      // Admin tokens: look up in Admin collection, not User collection
      if (decoded.role === "Admin") {
        const admin = await Admin.findById(decoded.userId).select("_id").lean();
        if (!admin) return res.status(401).json({ message: "Admin session invalid." });
        if (!req.query.userId) req.query.userId = decoded.userId?.toString();
        req.userRole = "Admin";
        return next();
      }

      if (await enforceUserGate(decoded.userId, res)) return;

      if (!req.query.userId) req.query.userId = decoded.userId?.toString();
      if (decoded.role) req.userRole = decoded.role;
      return next();
    } catch (_) {}

    // Fallback: legacy JWT_SECRET (old user sessions still in the wild)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Legacy tokens are user tokens (admin always used a separate secret),
      // so apply the same deactivation + re-verification gate here too.
      if (await enforceUserGate(decoded.userId, res)) return;
      if (!req.query.userId) req.query.userId = decoded.userId?.toString();
      if (decoded.role) req.userRole = decoded.role;
      return next();
    } catch (_) {}
  }

  // No valid Bearer token — reject. (The old React client's ?userId= query-param
  // fallback was removed: it allowed bypassing auth entirely. The Next.js client
  // always sends a Bearer JWT, and its axios interceptor handles 401 by redirecting.)
  logger.info("Unauthenticated request rejected — no valid token.");
  return res.status(401).json({ message: "Authentication required. Please sign in." });
};

module.exports = authenticate;

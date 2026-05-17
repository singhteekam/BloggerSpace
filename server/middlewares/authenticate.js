const jwt = require("jsonwebtoken");
const logger = require("./../utils/Logging/logs");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    // Try CURRENT_JWT_SECRET first (new unified tokens)
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
      // DB check — catches admin-initiated deactivation
      const user = await User.findById(decoded.userId).select("status").lean();
      if (!user || user.status === "INACTIVE") {
        return res.status(401).json({ message: "Account deactivated. Please contact support." });
      }
      if (!req.query.userId) req.query.userId = decoded.userId?.toString();
      if (decoded.role) req.userRole = decoded.role;
      return next();
    } catch (_) {}

    // Fallback: legacy JWT_SECRET (old user sessions still in the wild)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!req.query.userId) req.query.userId = decoded.userId?.toString();
      if (decoded.role) req.userRole = decoded.role;
      return next();
    } catch (_) {}
  }

  // OLD- Backward compat: check userId in query params (for old React client)
  console.log("Useridd: ", req.query.userId);
  if (req.query.userId) {
    next();
  } else {
    logger.info("User is not logged in.. Redirecting to login page.");
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect("/login");
    });
  }
};

module.exports = authenticate;

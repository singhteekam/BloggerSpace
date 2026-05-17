const jwt = require("jsonwebtoken");
const User = require("../models/User");

const reviewerMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
      if (decoded.role === "Reviewer" || decoded.role === "reviewer") {
        // DB check — catches admin-initiated role removal or deactivation
        const user = await User.findById(decoded.userId).select("status role").lean();
        if (!user || user.status === "INACTIVE" || user.role !== "reviewer") {
          return res.status(401).json({ message: "Access revoked. Please sign in again." });
        }
        if (!req.query.userId) req.query.userId = decoded.userId?.toString();
        if (!req.query.role) req.query.role = decoded.role;
        return next();
      }
    } catch (err) {
      // Token invalid or expired
    }
  }

  // Backward compat: query params from old React client
  if (req.query.userId && (req.query.role === "Reviewer" || req.query.role === "reviewer")) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};

module.exports = reviewerMiddleware;

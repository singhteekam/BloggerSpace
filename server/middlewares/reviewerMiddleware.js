const jwt = require("jsonwebtoken");

const reviewerMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
      // Accept old "Reviewer" (Reviewer collection) and new "reviewer" (User collection)
      if (decoded.role === "Reviewer" || decoded.role === "reviewer") {
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

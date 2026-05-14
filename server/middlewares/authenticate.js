// authMiddleware.js
// NEW- Import JWT for token verification
const jwt = require("jsonwebtoken");
const logger = require("./../utils/Logging/logs");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    // Try CURRENT_JWT_SECRET first (new unified tokens — users, reviewers, admin)
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
      if (!req.query.userId) req.query.userId = decoded.userId?.toString();
      return next();
    } catch (_) {}
    // Fallback: legacy JWT_SECRET (old user sessions still in the wild)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!req.query.userId) req.query.userId = decoded.userId?.toString();
      return next();
    } catch (_) {}
  }

  // OLD- Backward compat: check userId in query params (for old React client)
  // console.log("Time: ", Date.now());
  // console.log("Cookie expire time: ", req.session.cookie.expires);
  // console.log("Is Cookie expired: ", req.session.cookie.expires < Date.now());
  // console.log(req.isAuthenticated());
  // if (req.session && req.session.userId) {
  // if (req.session && req.session.userId && req.isAuthenticated() && req.session.cookie.expires > Date.now()) {
  // if (req.session && req.session.userId && req.session.cookie.expires > Date.now()) {
  console.log("Useridd: ", req.query.userId);
  if (req.query.userId) {
    // User is authenticated, proceed to the next middleware or route handler
    // logger.info("Authentication successful!!");
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error
    // res.status(401).json({ message: "Unauthorized" });
    logger.info("User is not logged in.. Redirecting to login page.");
    // res.redirect("/login");
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  }
};

module.exports = authenticate;

// adminMiddleware.js
// NEW- Import JWT for token verification
const jwt = require("jsonwebtoken");

const adminMiddleware = (req, res, next) => {
  // NEW- Primary auth: verify JWT Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
      // NEW- Check role in JWT payload
      if (decoded.role === "Admin") {
        // NEW- Set query params from JWT so all existing controllers work unchanged
        if (!req.query.userId) req.query.userId = decoded.userId?.toString();
        if (!req.query.role) req.query.role = decoded.role;
        return next();
      }
    } catch (err) {
      // NEW- Token invalid or expired — fall through to legacy query param check
    }
  }

  // OLD- Backward compat: check userId and role in query params (for old React client)
  // if (req.session && req.session.currentuserId && req.session.currentrole==="Admin") {
  if (req.query.userId && req.query.role === "Admin") {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error
    console.log("In error");
    res.status(401).json({ message: "Unauthorized" });
    // res.redirect("/login");
  }
};

module.exports = adminMiddleware;

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
      if (decoded.role === "Admin") {
        // DB check — verify the admin account still exists
        const admin = await Admin.findById(decoded.userId).select("_id").lean();
        if (!admin) {
          return res.status(401).json({ message: "Session invalid. Please sign in again." });
        }
        if (!req.query.userId) req.query.userId = decoded.userId?.toString();
        if (!req.query.role) req.query.role = decoded.role;
        return next();
      }
    } catch (err) {
      // Token invalid or expired — reject below.
    }
  }

  // No valid admin Bearer token. (The old React client's ?userId=&role=Admin
  // query-param fallback was removed — it allowed bypassing admin auth entirely.
  // The Next.js admin client always sends a Bearer JWT.)
  res.status(401).json({ message: "Unauthorized" });
};

module.exports = adminMiddleware;

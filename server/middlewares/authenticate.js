// authMiddleware.js
const logger= require("./../utils/Logging/logs");
const authenticate = (req, res, next) => {
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware or route handler
    // logger.info("Authentication successful!!");
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error
    // res.status(401).json({ message: "Unauthorized" });
    logger.info("User is not logged in.. Redirecting to login page.");
    res.redirect("/login");
  }
};

module.exports = authenticate;

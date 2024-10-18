// authMiddleware.js
const logger= require("./../utils/Logging/logs");
const authenticate = (req, res, next) => {
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

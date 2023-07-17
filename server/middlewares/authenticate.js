// authMiddleware.js
const authenticate = (req, res, next) => {
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error
    // res.status(401).json({ message: "Unauthorized" });
    res.redirect("/login");
  }
};

module.exports = authenticate;

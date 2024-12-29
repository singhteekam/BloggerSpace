// adminMiddleware.js
const adminMiddleware = (req, res, next) => {
  // if (req.session && req.session.currentuserId && req.session.currentrole==="Admin") {
    if (req.query.userId && req.query.role==="Admin") {
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

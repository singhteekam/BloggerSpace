// adminMiddleware.js
const reviewerMiddleware = (req, res, next) => {
  // if (
  //   req.session &&
  //   req.session.currentuserId &&
  //   req.session.currentrole === "Reviewer"
  // ) {
  if (req.query.userId && req.query.role==="Reviewer") {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page or return an error
    console.log("In error");
    res.status(401).json({ message: "Unauthorized" });
    // res.redirect("/login");
  }
};

module.exports = reviewerMiddleware;

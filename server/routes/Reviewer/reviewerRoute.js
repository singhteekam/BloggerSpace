const express = require("express");
const router = express.Router();
const {
  reviewerSignup,
  reviewerLogin,
  userDetails,
  uploadUserProfilePicture,
  pendingReviewBlogs,
  editPendingBlog,
  saveEditedPendingBlog,
  deleteReviewerAccount,
  feedbackToAuthor,
  changeUsername,
  discardQueueBlog,
} = require("../../controllers/Reviewer/reviewerController");
const reviewerMiddleware = require("../../middlewares/reviewerMiddleware");
const { changeAccountPassword } = require("../../utils/changeAccountPassword");
const { forgotPassword } = require("../../utils/forgotPassword");
const { resetPassword } = require("../../utils/resetPassword");

router.post("/signup", reviewerSignup);

router.post("/login", reviewerLogin);

//Currently logged in user details
router.get("/userdetails", userDetails);

// Profile picture
router.post("/uploaduserprofilepicture", uploadUserProfilePicture);

// Pending for Review
router.get("/pendingreviewblogs",reviewerMiddleware, pendingReviewBlogs);

router.get("/blog/editblog/:id",reviewerMiddleware, editPendingBlog);

router.put("/blog/editblog/save/:id",reviewerMiddleware, saveEditedPendingBlog);

// Delete Account
router.put("/account/delete",reviewerMiddleware, deleteReviewerAccount);

router.post("/feedbacktoauthor",reviewerMiddleware, feedbackToAuthor);


router.patch("/changeusername", changeUsername)


router.post("/discardqueue/:id", reviewerMiddleware, discardQueueBlog)


router.post("/changepassword", changeAccountPassword);

router.post("/forgotpassword", forgotPassword);

router.post("/resetpassword", resetPassword);

module.exports = router;

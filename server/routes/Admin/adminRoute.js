const express = require("express");
const router = express.Router();

const {
  adminSignup,
  adminLogin,
  inReviewBlogs,
  editInReviewBlog,
  saveEditedInReviewBlog,
  publishedBlogs,
  allReviewersFromDB,
  allPendingBlogsfromDB,
  updateReviewerAssignment,
  allUnderReviewBlogsfromDB,
  fetchDiscardQueueBlogsFromDB,
  fetchAwaitingAuthorFromDB
} = require("../../controllers/Admin/adminController");
const adminMiddleware = require("../../middlewares/adminMiddleware");
const { discardBlogFromDB } = require("../../utils/discardBlog");

router.post("/signup", adminSignup);

router.post("/login", adminLogin);

router.get("/inreviewblogs", adminMiddleware, inReviewBlogs);

router.get("/blog/editblog/:id",adminMiddleware, editInReviewBlog)

router.put("/blog/publish/:id",adminMiddleware, saveEditedInReviewBlog);

router.get("/published", adminMiddleware, publishedBlogs)

router.get("/allreviewers",adminMiddleware, allReviewersFromDB);

router.get("/pendingblogs",adminMiddleware, allPendingBlogsfromDB);

router.patch("/assign/blog/:id", adminMiddleware, updateReviewerAssignment);

router.get("/underreviewblogs", adminMiddleware, allUnderReviewBlogsfromDB);

router.get("/discardqueueblogs", adminMiddleware, fetchDiscardQueueBlogsFromDB);

router.post("/discard/blog/:id", adminMiddleware, discardBlogFromDB);

router.get("/awaitingauthorblogs", fetchAwaitingAuthorFromDB);

module.exports = router;
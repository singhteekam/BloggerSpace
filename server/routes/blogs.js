const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");

const {
  viewBlogRoute,
  createNewBlog,
  editBlog,
  saveEditedBlog,
  postNewBlogComment,
  viewBlogComments,
  blogsHomepage,
  searchBlogsFromDB,
  awaitingAuthorBlogs,
  authorPublishedBlogs,
  authorSavedDraftBlogs,
  authorPendingReviewBlogs,
  authorUnderReviewBlogs,
  saveAsDraftBlog,
  blogLikes,
  blogCommentLikes,
  isUniqueTitle,
} = require("../controllers/blogsController");

router.get("/", blogsHomepage);

router.get("/:blogSlug", viewBlogRoute);

router.post("/saveasdraft", saveAsDraftBlog);

router.post("/newblog", authenticate, createNewBlog);

router.post("/isuniquetitle", isUniqueTitle);

router.get("/editblog/:id", authenticate, editBlog);

router.put("/editblog/save/:id", authenticate, saveEditedBlog);

router.post("/:blogSlug/comments", authenticate, postNewBlogComment);

// Get comments of a blog
router.get("/:blogSlug/comments", viewBlogComments);

router.get("/searchblogs/:query", searchBlogsFromDB);

router.get("/myblogs/saveddraft", authenticate, authorSavedDraftBlogs);

router.get("/myblogs/pendingreview", authenticate, authorPendingReviewBlogs);

router.get("/myblogs/underreview", authenticate, authorUnderReviewBlogs);

router.get("/myblogs/awaitingauthorblogs", authenticate, awaitingAuthorBlogs);

router.get("/myblogs/authorpublishedblogs",authenticate,authorPublishedBlogs);

router.post("/bloglikes/:id",authenticate, blogLikes);

router.post("/blogcommentlike/:id", authenticate, blogCommentLikes);

module.exports = router;

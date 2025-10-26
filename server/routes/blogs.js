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
  addBlogViewsCounter,
  postNewBlogReplyComment,
  fetchAllBlogs,
  fetchBlogsByCategory,
  fetchBlogByBlogId,
  fetchMostViewedBlogs,
  fetchRelatedBlogs,
  fetchAllBlogsFromDB,
  createNewAIBlog,
} = require("../controllers/blogsController");
const { downloadBlog } = require("../controllers/userscontroller");

router.get("/", blogsHomepage);

router.get("/allblogs", fetchAllBlogs);

router.get("/fetchallblogs", fetchAllBlogsFromDB);

// fetch Blogs by category filter 
router.get("/allblogs/category/:filterCategory", fetchBlogsByCategory);

// Most Viewed blogs
// router.get("/mostviewedblogs", fetchMostViewedBlogs);

// Related Blogs
// router.get("/relatedblogs/:blogId", fetchRelatedBlogs);

router.get("/:blogSlug", viewBlogRoute);

router.get("/fetchblog/:blogId", fetchBlogByBlogId);

router.post("/saveasdraft",authenticate, saveAsDraftBlog);

router.post("/newblog", authenticate, createNewBlog);

router.post("/generateblog", authenticate, createNewAIBlog);

router.post("/isuniquetitle", isUniqueTitle);

router.get("/editblog/:id", authenticate, editBlog);

router.put("/editblog/save/:id", authenticate, saveEditedBlog);

router.post("/:blogSlug/comments", authenticate, postNewBlogComment);

router.post("/:blogSlug/comments/reply", authenticate, postNewBlogReplyComment);

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

router.patch("/updateblogviews", addBlogViewsCounter);

router.post("/downloadblog", downloadBlog);

module.exports = router;


/* TRANSITION STATUSES:
UNDERREVIEW-INREVIEW
INREVIEW-PUBLISHED
INREVIEW-UNDERREVIEW
UNDERREVIEW-AWAITINGAUTHOR
UNDERREVIEW-DISCARDQUEUE

*/
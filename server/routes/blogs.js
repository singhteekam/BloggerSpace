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
  isUniqueSlug,
  addBlogViewsCounter,
  getBlogViews,
  postNewBlogReplyComment,
  fetchAllBlogs,
  fetchBlogsByCategory,
  fetchBlogByBlogId,
  fetchRelatedBlogs,
  fetchAllBlogsFromDB,
  createNewAIBlog,
  fetchTopViewedBlogs,
  fetchAdminPublishedBlogs,
  getDistinctCategories,
  getDistinctTags,
  toggleBlogLike,
  getBlogLikeStatus,
  fetchBlogsForSitemap,
  fetchAuthorsForSitemap,
  toggleCommentLike,
  toggleReplyLike,
  getRecommendedBlogs,
} = require("../controllers/blogsController");
const { downloadBlog } = require("../controllers/userscontroller");

router.get("/", blogsHomepage);

router.get("/allblogs", fetchAllBlogs);

router.get("/sitemap", fetchBlogsForSitemap);

router.get("/authors/sitemap", fetchAuthorsForSitemap);

router.get("/adminpublished", fetchAdminPublishedBlogs);

router.get("/categories", getDistinctCategories);

router.get("/tags", getDistinctTags);

router.get("/fetchallblogs", fetchAllBlogsFromDB);

// fetch Blogs by category filter 
router.get("/allblogs/category/:filterCategory", fetchBlogsByCategory);

// Top Viewed blogs
router.get("/topviewedblogs", fetchTopViewedBlogs);

// Recommended (personalized) / Trending (fallback) blogs
router.get("/recommended", getRecommendedBlogs);

// Related Blogs
router.get("/:blogId/related", fetchRelatedBlogs);

// Related Blogs
// router.get("/relatedblogs/:blogId", fetchRelatedBlogs);

router.get("/:blogSlug", viewBlogRoute);

// Lightweight live read of a blog's current view count (no increment). Two path
// segments, so it never collides with the single-segment "/:blogSlug" above.
router.get("/:blogSlug/views", getBlogViews);

router.get("/fetchblog/:blogId", fetchBlogByBlogId);

router.post("/saveasdraft",authenticate, saveAsDraftBlog);

router.post("/newblog", authenticate, createNewBlog);

router.post("/generateblog", authenticate, createNewAIBlog);

router.post("/isuniquetitle", isUniqueTitle);
router.post("/isuniqueslug", isUniqueSlug);

router.get("/editblog/:id", authenticate, editBlog);

router.put("/editblog/save/:id", authenticate, saveEditedBlog);

router.post("/:blogSlug/comments", authenticate, postNewBlogComment);

router.post("/:blogSlug/comments/reply", authenticate, postNewBlogReplyComment);

// Get comments of a blog
router.get("/:blogSlug/comments", viewBlogComments);

// Like/unlike a comment or reply
router.post("/:blogSlug/comments/:commentId/like", authenticate, toggleCommentLike);
router.post("/:blogSlug/comments/:commentId/replies/:replyId/like", authenticate, toggleReplyLike);

router.get("/searchblogs/:query", searchBlogsFromDB);

router.get("/myblogs/saveddraft", authenticate, authorSavedDraftBlogs);

router.get("/myblogs/pendingreview", authenticate, authorPendingReviewBlogs);

router.get("/myblogs/underreview", authenticate, authorUnderReviewBlogs);

router.get("/myblogs/awaitingauthorblogs", authenticate, awaitingAuthorBlogs);

router.get("/myblogs/authorpublishedblogs",authenticate,authorPublishedBlogs);

router.post("/bloglikes/:id",authenticate, blogLikes);

router.post("/:id/like", authenticate, toggleBlogLike);

router.get("/:id/likecheck", getBlogLikeStatus);

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
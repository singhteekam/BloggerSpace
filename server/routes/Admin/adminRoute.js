const express = require("express");
const router = express.Router();

const {
  adminSignup,
  adminLogin,
  adminVerifyLoginOtp,
  adminResendLoginOtp,
  inReviewBlogs,
  editInReviewBlog,
  saveEditedInReviewBlog,
  publishedBlogs,
  allReviewersFromDB,
  allPendingBlogsfromDB,
  updateReviewerAssignment,
  allUnderReviewBlogsfromDB,
  fetchDiscardQueueBlogsFromDB,
  fetchAwaitingAuthorFromDB,
  fetchAllVerifiedReviewers,
  fetchAllPendingRequestReviewers,
  approveReviewerRequest,
  rejectReviewerRequest,
  removeFromReviewerRole,
  fetchAllUsers,
  getNewsletterRecipients,
  getDeletedUsers,
  deleteUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
  getCommunityPosts,
  deleteCommunityPost,
  deleteCommentFromPost,
  adminNewBlog,
  adminSaveAsDraftBlog,
  adminDraftBlogs,
  adminPublishedBlogs,
  adminDiscardedBlogs,
  adminWrittenDiscardBlogFromDB,
  adminBlogEdit,
  adminSaveEditedBlog,
  sendNewsletter,
  getNewsletterHistory,
  updateSitemapXML,
  downloadExcelReport,
  downloadPDFReport,
  fetchAdminBlogs,
  migrateReviewersToUsers,
  discardAnyBlog,
  adminEditAnyBlog,
  deleteBlogPermanently,
  adminGetInfo,
  adminUpdateProfile,
  adminUploadProfilePicture,
  addBlogToAdminSaved,
  removeBlogFromAdminSaved,
  getAdminSavedBlogs,
  awardGems,
  updateGems,
  getGemsTransactions,
  grantGems,
  reverseGrant,
  setBlogScore,
  setReviewerScore,
  getUserContent,
  adminForceDeleteBlog,
  getPostComments,
  deleteBlogComment,
  deleteBlogReply,
} = require("../../controllers/Admin/adminController");
const adminMiddleware = require("../../middlewares/adminMiddleware");
const { discardBlogFromDB } = require("../../utils/discardBlog");
const {
  getNotificationConfig,
  updateNotificationConfig,
  sendTestNotification,
  triggerNotificationRun,
  getNotificationHistory,
} = require("../../controllers/notificationController");

router.post("/signup", adminSignup);

router.post("/login", adminLogin);
router.post("/login/verify-otp", adminVerifyLoginOtp);
router.post("/login/resend-otp", adminResendLoginOtp);

router.get("/adminblogs", fetchAdminBlogs);

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

router.get("/dashboard/verifiedreviewers", adminMiddleware, fetchAllVerifiedReviewers);

router.get("/dashboard/pendingrequests", adminMiddleware, fetchAllPendingRequestReviewers);

router.patch("/dashboard/approvereviewer/:id", adminMiddleware, approveReviewerRequest);

router.patch("/dashboard/rejectreviewer/:id", adminMiddleware, rejectReviewerRequest);

router.patch("/dashboard/removefromreviewer/:id", adminMiddleware, removeFromReviewerRole);

router.get("/dashboard/allusers", adminMiddleware, fetchAllUsers);

// Lightweight full recipient list for the newsletter composer.
router.get("/dashboard/newsletter-recipients", adminMiddleware, getNewsletterRecipients);

router.get("/dashboard/deletedusers", adminMiddleware, getDeletedUsers);

router.put("/dashboard/deleteuser/:id", adminMiddleware, deleteUserAccount);
router.patch("/dashboard/deactivateuser/:id", adminMiddleware, deactivateUserAccount);
router.patch("/dashboard/reactivateuser/:id", adminMiddleware, reactivateUserAccount);

// ── Push notification controls ──────────────────────────────────
router.get("/notifications/config", adminMiddleware, getNotificationConfig);
router.patch("/notifications/config", adminMiddleware, updateNotificationConfig);
router.post("/notifications/test", adminMiddleware, sendTestNotification);
router.post("/notifications/run", adminMiddleware, triggerNotificationRun);
router.get("/notifications/history", adminMiddleware, getNotificationHistory);

router.get("/community", adminMiddleware, getCommunityPosts);

router.delete("/deletecommunitypost/:id", adminMiddleware, deleteCommunityPost);

router.post("/blogs/newblog", adminMiddleware, adminNewBlog);

router.post("/blogs/saveasdraft", adminMiddleware,adminSaveAsDraftBlog);

router.get("/blogs/drafts", adminMiddleware,adminDraftBlogs);
router.get("/blogs/published",adminPublishedBlogs);

router.get("/blogs/discarded", adminMiddleware,adminDiscardedBlogs);
router.post("/blogs/adminblogdiscard/:id", adminMiddleware,adminWrittenDiscardBlogFromDB);

router.get("/blogs/editblog/:id", adminMiddleware,adminBlogEdit);
router.put("/blogs/editblog/save/:id", adminMiddleware,adminSaveEditedBlog);

router.post("/newsletter/send", adminMiddleware, sendNewsletter);
router.get("/newsletter/history", adminMiddleware, getNewsletterHistory);

router.get("/updatesitemapxml", adminMiddleware, updateSitemapXML);

router.get("/dashboard/downloadexcel",adminMiddleware, downloadExcelReport)
router.get("/dashboard/downloadpdf", adminMiddleware, downloadPDFReport)

router.post("/dashboard/migrate-reviewers", adminMiddleware, migrateReviewersToUsers);

router.post("/blogs/discard/:id", adminMiddleware, discardAnyBlog);
router.put("/blogs/edit/:id", adminMiddleware, adminEditAnyBlog);
router.delete("/blogs/delete/:id", adminMiddleware, deleteBlogPermanently);

router.get("/profile", adminMiddleware, adminGetInfo);
router.patch("/profile/update", adminMiddleware, adminUpdateProfile);
router.post("/profile/uploadpicture", adminMiddleware, adminUploadProfilePicture);

router.get("/savedblogs", adminMiddleware, getAdminSavedBlogs);
router.patch("/savedblogs/add", adminMiddleware, addBlogToAdminSaved);
router.delete("/savedblogs/remove/:blogSlug", adminMiddleware, removeBlogFromAdminSaved);

// Community comment management
router.get("/community/:postId/comments", adminMiddleware, getPostComments);
router.delete("/community/:postId/comment/:commentId", adminMiddleware, deleteCommentFromPost);

// Blog comment moderation (admin) — delete a comment or a reply inline
router.delete("/blogs/:slug/comment/:commentId/reply/:replyId", adminMiddleware, deleteBlogReply);
router.delete("/blogs/:slug/comment/:commentId", adminMiddleware, deleteBlogComment);

// Gems
router.post("/gems/award/:blogId", adminMiddleware, awardGems);
router.patch("/gems/update/:blogId", adminMiddleware, updateGems);
router.get("/gems/transactions", adminMiddleware, getGemsTransactions);
// Phase 3 — admin grants (non-blog gem rewards)
router.post("/gems/grant/:userId", adminMiddleware, grantGems);
router.post("/gems/reverse/:txnId", adminMiddleware, reverseGrant);

// Phase 5 — admin-assigned blog quality score
router.patch("/blogs/:id/score", adminMiddleware, setBlogScore);

// Phase 6 — admin-assigned reviewer quality score (one per blog+reviewer pair)
router.patch("/blogs/:blogId/reviewer-score/:reviewerId", adminMiddleware, setReviewerScore);

// User content (team management profile view)
router.get("/users/:userId/content", adminMiddleware, getUserContent);
router.delete("/users/:userId/blog/:blogId", adminMiddleware, adminForceDeleteBlog);

// Admin platform configuration (singleton — gems, redemption, scoring caps)
const { getAdminConfig, updateAdminConfig } = require("../../controllers/Admin/adminConfigController");
router.get("/config", adminMiddleware, getAdminConfig);
router.patch("/config", adminMiddleware, updateAdminConfig);

// Phase 4 — redemption requests admin review
const {
  listAllRedemptions,
  fulfillRedemption,
  rejectRedemption,
} = require("../../controllers/redemptionController");
router.get("/redemptions", adminMiddleware, listAllRedemptions);
router.patch("/redemptions/:id/fulfill", adminMiddleware, fulfillRedemption);
router.patch("/redemptions/:id/reject", adminMiddleware, rejectRedemption);

module.exports = router;
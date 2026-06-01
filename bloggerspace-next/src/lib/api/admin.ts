import { api } from "./client";
import type { AuthUser } from "./auth";

export type AdminAuthResponse = {
  message: string;
  token: string;
  adminDetails: AuthUser;
};

export type AdminBlog = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  status: string;
  currentReviewer: string;
  lastUpdatedAt: string;
  createdAt: string;
  authorDetails: {
    _id: string;
    fullName: string;
    email: string;
    userName: string;
  };
  reviewedBy?: { reviewerId: string; reviewerName?: string }[];
  gems?: GemsInfo;
  blogScore?: number;
};

export type ReviewHistoryEntry = {
  reviewerName: string;
  role: string;
  action: string;
  rating: number | null;
  remarks: string;
  date: string | null;
};

export type AdminBlogDetail = AdminBlog & { content: string; reviewHistory?: ReviewHistoryEntry[] };

export type ReviewerItem = {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  isVerified: boolean;
  status: string;
  reviewerStatus?: string;
  role?: string;
  profilePicture?: string;
  createdAt: string;
  reviewedBlogs: unknown[];
  gems?: number;
  authType?: string;
  lastLogin?: string;
  lastVerifiedAt?: string | null;
};

export type UserItem = {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  status: string;
  isVerified?: boolean;
  role?: string;
  createdAt: string;
  gems?: number;
  authType?: string;
  lastLogin?: string;
  lastVerifiedAt?: string | null;
  reverifyAttempts?: number;
  newsletterOptIn?: boolean;
};

export type DeletedUserItem = {
  _id: string;
  fullName: string;
  userName?: string;
  email: string;
  role?: string;
  createdAt: string;
  deletedAt: string | null;
  purgeAt: string | null;
};

export type CommunityPost = {
  _id: string;
  communityPostId: string;
  communityPostSlug: string;
  communityPostTopic: string;
  communityPostCategory: string;
  communityPostAuthor: { _id?: string; fullName: string; email: string };
  createdAt: string;
};

export type AdminBlogWritePayload = {
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
};

export type PublishPayload = {
  slug: string;
  title: string;
  content: string;
  category: string;
  rating: number;
  reviewRemarks: string;
  tags: string[];
  userId: string;
  role: string;
  email: string;
};

const p = (userId: string) => ({ userId, role: "Admin" });

export const adminApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AdminAuthResponse>("/api/admin/login", data),

  verifyLoginOtp: (email: string, otp: string) =>
    api.post<AdminAuthResponse>("/api/admin/login/verify-otp", { email, otp }),

  resendLoginOtp: (email: string) =>
    api.post<{ message: string }>("/api/admin/login/resend-otp", { email }),

  // ── Blog queues ────────────────────────────────────────────────────
  getPendingBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/pendingblogs", { params: p(userId) }),

  getInReviewBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/inreviewblogs", { params: p(userId) }),

  getPublishedBlogs: (userId: string, page = 1, search = "") =>
    api.get<{ blogs: AdminBlog[]; totalCount: number; currentPage: number; totalPages: number }>(
      "/api/admin/published",
      { params: { ...p(userId), page, limit: 30, ...(search ? { search } : {}) } },
    ),

  getBlogForReview: (blogId: string, userId: string) =>
    api.get<AdminBlogDetail>(`/api/admin/blog/editblog/${blogId}`, { params: p(userId) }),

  publishBlog: (blogId: string, payload: PublishPayload) =>
    api.put<{ message: string }>(`/api/admin/blog/publish/${blogId}`, payload, {
      params: p(payload.userId),
    }),

  // ── Reviewer assignment ────────────────────────────────────────────
  getAllReviewers: (userId: string) =>
    api.get<ReviewerItem[]>("/api/admin/allreviewers", { params: p(userId) }),

  assignReviewer: (blogId: string, userId: string, assignedUser: string) =>
    api.patch<{ message: string }>(`/api/admin/assign/blog/${blogId}`, { assignedUser }, { params: p(userId) }),

  // ── Reviewer management ───────────────────────────────────────────
  getVerifiedReviewers: (userId: string) =>
    api.get<ReviewerItem[]>("/api/admin/dashboard/verifiedreviewers", { params: p(userId) }),

  getPendingReviewers: (userId: string) =>
    api.get<ReviewerItem[]>("/api/admin/dashboard/pendingrequests", { params: p(userId) }),

  approveReviewer: (reviewerId: string, userId: string) =>
    api.patch<{ message: string }>(`/api/admin/dashboard/approvereviewer/${reviewerId}`, {}, { params: p(userId) }),

  rejectReviewer: (reviewerId: string, userId: string) =>
    api.patch<{ message: string }>(`/api/admin/dashboard/rejectreviewer/${reviewerId}`, {}, { params: p(userId) }),

  removeReviewer: (reviewerId: string, userId: string) =>
    api.patch<{ message: string }>(`/api/admin/dashboard/removefromreviewer/${reviewerId}`, {}, { params: p(userId) }),

  // ── User management ───────────────────────────────────────────────
  getUsers: (userId: string) =>
    api.get<UserItem[]>("/api/admin/dashboard/allusers", { params: p(userId) }),

  getDeletedUsers: (userId: string) =>
    api.get<DeletedUserItem[]>("/api/admin/dashboard/deletedusers", { params: p(userId) }),

  deleteUser: (targetUserId: string, userEmail: string, adminId: string) =>
    api.put<{ message: string }>(`/api/admin/dashboard/deleteuser/${targetUserId}`, {}, {
      params: { ...p(adminId), useremail: userEmail },
    }),

  deactivateUser: (targetUserId: string, adminId: string) =>
    api.patch<{ message: string }>(`/api/admin/dashboard/deactivateuser/${targetUserId}`, {}, { params: p(adminId) }),

  reactivateUser: (targetUserId: string, adminId: string) =>
    api.patch<{ message: string }>(`/api/admin/dashboard/reactivateuser/${targetUserId}`, {}, { params: p(adminId) }),

  // ── Community ─────────────────────────────────────────────────────
  getCommunityPosts: (userId: string, page = 1, search = "") =>
    api.get<{ posts: CommunityPost[]; total: number; page: number; pages: number }>(
      "/api/admin/community",
      { params: { ...p(userId), page, limit: 20, ...(search ? { search } : {}) } },
    ),

  deleteCommunityPost: (postId: string, userId: string) =>
    api.delete<{ message: string }>(`/api/admin/deletecommunitypost/${postId}`, { params: p(userId) }),

  // ── Awaiting author ───────────────────────────────────────────────
  getAwaitingAuthorBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/awaitingauthorblogs", { params: p(userId) }),

  // ── Discard queue ─────────────────────────────────────────────────
  getDiscardQueue: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/discardqueueblogs", { params: p(userId) }),

  // ── Newsletter ────────────────────────────────────────────────────
  sendNewsletter: (
    userId: string,
    payload: {
      selectedUsers: { value: string; label: string }[];
      subject: string;
      message: string;
    },
  ) =>
    api.post<{ message: string }>("/api/admin/newsletter/send", payload, { params: p(userId) }),

  // ── Under Review ──────────────────────────────────────────────────
  getUnderReviewBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/underreviewblogs", { params: p(userId) }),

  // ── Blog edit / discard ───────────────────────────────────────────
  getAdminBlogForEdit: (blogId: string, userId: string) =>
    api.get<AdminBlogDetail>(`/api/admin/blogs/editblog/${blogId}`, { params: p(userId) }),

  saveAdminBlogEdit: (
    blogId: string,
    userId: string,
    payload: { title: string; slug: string; content: string; category: string; tags: string[] },
  ) => api.put<{ message: string }>(`/api/admin/blogs/edit/${blogId}`, payload, { params: p(userId) }),

  discardBlog: (blogId: string, userId: string) =>
    api.post<{ message: string }>(`/api/admin/blogs/discard/${blogId}`, {}, { params: p(userId) }),

  // ── Admin-written blogs ───────────────────────────────────────────
  getAdminDraftBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/blogs/drafts", { params: p(userId) }),

  getAdminPublishedBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/blogs/published", { params: p(userId) }),

  getAdminDiscardedBlogs: (userId: string) =>
    api.get<AdminBlog[]>("/api/admin/blogs/discarded", { params: p(userId) }),

  createAdminBlog: (userId: string, payload: AdminBlogWritePayload) =>
    api.post<AdminBlog>("/api/admin/blogs/newblog", payload, { params: p(userId) }),

  saveAdminBlogAsDraft: (userId: string, payload: AdminBlogWritePayload & { id?: string }) =>
    api.post<AdminBlog>("/api/admin/blogs/saveasdraft", payload, { params: p(userId) }),

  publishAdminBlogEdit: (blogId: string, userId: string, payload: AdminBlogWritePayload) =>
    api.put<{ message: string }>(`/api/admin/blogs/editblog/save/${blogId}`, payload, { params: p(userId) }),

  discardAdminBlog: (blogId: string, userId: string) =>
    api.post<{ message: string }>(`/api/admin/blogs/adminblogdiscard/${blogId}`, {}, { params: p(userId) }),

  deleteBlogPermanently: (blogId: string, userId: string) =>
    api.delete<{ message: string }>(`/api/admin/blogs/delete/${blogId}`, { params: p(userId) }),

  // ── Migration ─────────────────────────────────────────────────────
  migrateReviewers: (userId: string) =>
    api.post<{ message: string; total: number; migrated: number; merged: number; skipped: number }>(
      "/api/admin/dashboard/migrate-reviewers",
      {},
      { params: p(userId) },
    ),

  // ── Account ───────────────────────────────────────────────────────
  changePassword: (userId: string, payload: { oldPassword: string; newPassword: string }) =>
    api.post<{ message: string }>("/api/reviewer/changepassword", payload, {
      params: { userId, role: "Admin" },
    }),

  // ── Admin profile ─────────────────────────────────────────────────
  getAdminInfo: (userId: string) =>
    api.get<AuthUser>("/api/admin/profile", { params: p(userId) }),

  updateAdminProfile: (userId: string, data: { fullName: string; userName: string }) =>
    api.patch<{ message: string; adminDetails: AuthUser }>("/api/admin/profile/update", data, {
      params: p(userId),
    }),

  uploadAdminProfilePicture: (userId: string, file: File) => {
    const form = new FormData();
    form.append("profilePicture", file);
    return api.post<{ message: string }>("/api/admin/profile/uploadpicture", form, {
      params: p(userId),
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ── Saved blogs ───────────────────────────────────────────────────
  getAdminSavedBlogs: (userId: string) =>
    api.get<{ title: string; slug: string; category: string; tags: string[] }[]>("/api/admin/savedblogs", { params: p(userId) }),

  addAdminSavedBlog: (userId: string, payload: { title: string; slug: string; category: string; tags: string[] }) =>
    api.patch<{ message: string }>("/api/admin/savedblogs/add", payload, { params: p(userId) }),

  removeAdminSavedBlog: (userId: string, slug: string) =>
    api.delete<{ message: string }>(`/api/admin/savedblogs/remove/${slug}`, { params: p(userId) }),

  getAdminSavedSlugs: (userId: string) =>
    api.get<{ slug: string }[]>("/api/admin/savedblogs", { params: p(userId) }),

  // ── Newsletter history ────────────────────────────────────────────────────
  getNewsletterHistory: (userId: string, page = 1) =>
    api.get<{ newsletters: NewsletterRecord[]; total: number; page: number; pages: number }>(
      "/api/admin/newsletter/history",
      { params: { ...p(userId), page, limit: 20 } },
    ),

  // ── Community comments ────────────────────────────────────────────────────
  getPostComments: (postId: string, userId: string) =>
    api.get<{ postId: string; total: number; comments: PostComment[] }>(
      `/api/admin/community/${postId}/comments`,
      { params: p(userId) },
    ),

  deleteComment: (postId: string, commentId: string, userId: string) =>
    api.delete<{ message: string }>(`/api/admin/community/${postId}/comment/${commentId}`, { params: p(userId) }),

  // ── Gems ──────────────────────────────────────────────────────────────────
  awardGems: (
    userId: string,
    blogId: string,
    payload: { authorGems: number; reviewerAwards: { userId: string; gems: number }[] },
  ) =>
    api.post<{ message: string; gems: GemsInfo }>(`/api/admin/gems/award/${blogId}`, payload, { params: p(userId) }),

  updateGems: (
    userId: string,
    blogId: string,
    payload: { authorGems: number; reviewerAwards: { userId: string; gems: number }[] },
  ) =>
    api.patch<{ message: string; gems: GemsInfo }>(`/api/admin/gems/update/${blogId}`, payload, { params: p(userId) }),

  getGemsTransactions: (
    userId: string,
    page = 1,
    filterUserId?: string,
    source?: string,
  ) =>
    api.get<{ transactions: GemsTransaction[]; total: number; page: number; pages: number }>(
      "/api/admin/gems/transactions",
      {
        params: {
          ...p(userId),
          page,
          limit: 20,
          ...(filterUserId ? { filterUserId } : {}),
          ...(source ? { source } : {}),
        },
      },
    ),

  // Phase 3 — admin grants (non-blog gem rewards) + reversal within window
  grantGems: (
    adminId: string,
    targetUserId: string,
    payload: { amount: number; note?: string },
  ) =>
    api.post<{ message: string; balance: number; transaction: GemsTransaction }>(
      `/api/admin/gems/grant/${targetUserId}`,
      payload,
      { params: p(adminId) },
    ),

  reverseGrant: (
    adminId: string,
    txnId: string,
    payload: { reason?: string },
  ) =>
    api.post<{ message: string; balance: number; reverseTransaction: GemsTransaction }>(
      `/api/admin/gems/reverse/${txnId}`,
      payload,
      { params: p(adminId) },
    ),

  // Phase 5 — admin-assigned blog quality score
  setBlogScore: (adminId: string, blogId: string, score: number) =>
    api.patch<{ message: string; blogScore: number; creatorScore: number }>(
      `/api/admin/blogs/${blogId}/score`,
      { score },
      { params: p(adminId) },
    ),

  // Phase 6 — admin-assigned reviewer quality score (per blog)
  setReviewerScore: (
    adminId: string,
    blogId: string,
    reviewerId: string,
    score: number,
    note?: string,
  ) =>
    api.patch<{ message: string; reviewerScore: number; reviewerScoreAvg: number; reviewerScoreCount: number }>(
      `/api/admin/blogs/${blogId}/reviewer-score/${reviewerId}`,
      { score, note },
      { params: p(adminId) },
    ),

  // Phase 4 — redemption requests admin review
  listRedemptions: (
    adminId: string,
    page = 1,
    status?: "PENDING" | "FULFILLED" | "REJECTED",
  ) =>
    api.get<{
      requests: AdminRedemptionRequest[];
      total: number;
      pendingCount: number;
      page: number;
      pages: number;
    }>("/api/admin/redemptions", {
      params: { ...p(adminId), page, limit: 20, ...(status ? { status } : {}) },
    }),

  fulfillRedemption: (adminId: string, id: string, payload: { note?: string }) =>
    api.patch<{ message: string; request: AdminRedemptionRequest }>(
      `/api/admin/redemptions/${id}/fulfill`,
      payload,
      { params: p(adminId) },
    ),

  rejectRedemption: (adminId: string, id: string, payload: { reason?: string }) =>
    api.patch<{ message: string; request: AdminRedemptionRequest }>(
      `/api/admin/redemptions/${id}/reject`,
      payload,
      { params: p(adminId) },
    ),

  // ── User content (team management) ───────────────────────────────────────
  getUserContent: (adminId: string, targetUserId: string) =>
    api.get<UserContent>(`/api/admin/users/${targetUserId}/content`, { params: p(adminId) }),

  forceDeleteBlog: (adminId: string, targetUserId: string, blogId: string) =>
    api.delete<{ message: string }>(`/api/admin/users/${targetUserId}/blog/${blogId}`, { params: p(adminId) }),
};

// ── Extra types ───────────────────────────────────────────────────────────────

export type NewsletterRecord = {
  _id: string;
  subject: string;
  message: string;
  recipients: { email: string; name: string }[];
  recipientCount: number;
  sentAt: string;
};

export type GemsInfo = {
  authorGems: number;
  reviewerGems: number;
  reviewerUserId?: string;
  reviewerAwards?: { userId: string; gems: number }[];
  awarded: boolean;
  awardedAt?: string;
};

export type GemsTxnSource =
  | "BLOG_AWARD"
  | "ADMIN_GRANT"
  | "ADMIN_GRANT_REVERSE"
  | "REDEMPTION_DEDUCT"
  | "REDEMPTION_REFUND";

export type GemsTransaction = {
  _id: string;
  userId: { _id: string; fullName: string; userName: string; email: string } | string;
  blogId?: string;
  blogTitle?: string;
  blogSlug?: string;
  type: "AWARD" | "DEDUCT";
  role?: "AUTHOR" | "REVIEWER";
  amount: number;
  // Phase 1 additions — present on all new txns; defaults applied for legacy rows.
  source?: GemsTxnSource;
  note?: string;
  reversedByTxnId?: string | null;
  redemptionRequestId?: string | null;
  awardedBy?: { _id: string; fullName: string; userName: string; email: string } | string | null;
  createdAt: string;
};

export type PostComment = {
  _id: string;
  content: string;
  author: { _id: string; fullName: string; userName: string; email: string } | null;
  likes: number;
  createdAt: string;
  repliesCount: number;
};

export type UserContent = {
  user: {
    _id: string;
    fullName: string;
    userName: string;
    email: string;
    profilePicture?: string;
    gems: number;
    createdAt: string;
    role: string;
    isVerified: boolean;
    reviewedBlogs?: {
      BlogTitle: string;
      BlogSlug: string;
      BlogReviewedTime: string;
      reviewerGems?: number;
      blogId?: string | null;
      gemsAwarded?: boolean;
      blogGems?: {
        authorGems?: number;
        reviewerAwards?: { userId: string; gems: number }[];
        reviewerUserId?: string;
        reviewerGems?: number;
      } | null;
      blogAuthor?: { fullName?: string; email?: string } | null;
      blogReviewedBy?: { reviewerId: string; reviewerName?: string }[];
      /** Phase 6 — admin-assigned review quality score; null = not yet scored */
      reviewScore?: number | null;
    }[];
  };
  blogs: {
    _id: string;
    title: string;
    slug: string;
    status: string;
    category: string;
    createdAt: string;
    lastUpdatedAt?: string;
    gems?: GemsInfo;
    reviewedBy?: { reviewerId: string; reviewerName?: string }[];
  }[];
  communityPosts: {
    _id: string;
    communityPostId: string;
    communityPostSlug: string;
    communityPostTopic: string;
    communityPostCategory?: string;
    createdAt: string;
  }[];
};

// ── Admin config (platform-wide settings) ────────────────────────────
// Mirror of server/models/AdminConfig.js. All numbers are integers.
export type AdminConfigDoc = {
  _id: string;
  // Redemption
  gemValuePaise: number;
  minRedeemGems: number;
  maxRedeemGems: number;
  redemptionCooldownDays: number;
  newAccountFlagDays: number;
  redemptionMethods: string[];
  // Grants
  minGrantGems: number;
  maxGrantGems: number;
  grantReverseWindowHours: number;
  // Per-blog caps
  perBlogAuthorGemsCap: number;
  perBlogReviewerGemsCap: number;
  // Scoring
  maxBlogScore: number;
  // Re-verification
  reverificationPeriodDays: number;
  // Maintenance
  maintenanceMode: boolean;
  // Audit
  updatedAt: string;
  updatedBy: string | null;
};

export type AdminConfigUpdatePayload = Partial<
  Omit<AdminConfigDoc, "_id" | "updatedAt" | "updatedBy">
>;

export const adminConfigApi = {
  get: (adminId: string) =>
    api.get<AdminConfigDoc>("/api/admin/config", { params: p(adminId) }),

  update: (adminId: string, payload: AdminConfigUpdatePayload) =>
    api.patch<AdminConfigDoc>("/api/admin/config", payload, { params: p(adminId) }),
};

// ── Redemption requests (Phase 4) — admin view ─────────────────────────────
export type AdminRedemptionRequest = {
  _id: string;
  // Populated by the backend
  userId: {
    _id: string;
    fullName: string;
    userName: string;
    email: string;
    gems: number;
    createdAt: string;
    isVerified: boolean;
  } | string;
  gemsAmount: number;
  valueInPaise: number;
  method: "AMAZON_GIFT_CARD" | "FLIPKART_GIFT_CARD";
  recipientEmail: string;
  status: "PENDING" | "FULFILLED" | "REJECTED";
  isFlagged: boolean;
  flagReason: string;
  fulfilledAt?: string | null;
  fulfilledBy?: { _id: string; fullName: string; email: string } | string | null;
  fulfillmentNote?: string;
  rejectedAt?: string | null;
  rejectedBy?: { _id: string; fullName: string; email: string } | string | null;
  rejectionReason?: string;
  createdAt: string;
};

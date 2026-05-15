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
};

export type AdminBlogDetail = AdminBlog & { content: string };

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
};

export type CommunityPost = {
  _id: string;
  communityPostId: string;
  communityPostSlug: string;
  communityPostTopic: string;
  communityPostCategory: string;
  communityPostAuthor: { fullName: string; email: string };
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

  deleteUser: (targetUserId: string, userEmail: string, adminId: string) =>
    api.put<{ message: string }>(`/api/admin/dashboard/deleteuser/${targetUserId}`, {}, {
      params: { ...p(adminId), useremail: userEmail },
    }),

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
};

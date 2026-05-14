import { api } from "./client";

export type ReviewedBlogEntry = {
  BlogObjectId: string;
  BlogId: number;
  BlogTitle: string;
  BlogSlug: string;
  BlogReviewedTime: string;
};

export type ReviewerProfile = {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  profilePicture?: string;
  role: string;
  isVerified: boolean;
  reviewedBlogs: ReviewedBlogEntry[];
  createdAt?: string;
};

export type ReviewerBlogAuthor = {
  _id: string;
  fullName: string;
  email: string;
  userName: string;
};

export type FeedbackEntry = {
  ReviewerId: string;
  ReviewerEmail: string;
  Feedback: string;
  LastUpdated: string;
};

export type ReviewerBlogItem = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  status: string;
  currentReviewer: string;
  lastUpdatedAt: string;
  createdAt: string;
  authorDetails: ReviewerBlogAuthor;
  feedbackToAuthor: FeedbackEntry[];
};

export type ReviewerBlogDetail = ReviewerBlogItem & {
  content: string;
};

export type SaveEditsPayload = {
  slug: string;
  title: string;
  content: string;
  category: string;
  rating: number;
  reviewRemarks: string;
  tags: string[];
};

export type SaveDraftPayload = {
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
};

export const reviewerApi = {
  getProfile: () =>
    api.get<ReviewerProfile>("/api/reviewer/userdetails", {
      params: { role: "Reviewer" },
    }),

  updateProfile: (payload: { fullName: string; userName: string }) =>
    api.patch<{ message: string }>("/api/reviewer/changeusername", payload),

  uploadProfilePicture: (userId: string, file: File) => {
    const form = new FormData();
    form.append("profilePicture", file);
    return api.post<{ message: string }>("/api/reviewer/uploaduserprofilepicture", form, {
      params: { userId, role: "Reviewer" },
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    api.post<{ message: string }>("/api/reviewer/changepassword", payload),

  getAssignedBlogs: (userId: string, email: string) =>
    api.get<ReviewerBlogItem[]>("/api/reviewer/pendingreviewblogs", {
      params: { userId, email, role: "Reviewer" },
    }),

  getAwaitingAuthorBlogs: (userId: string, email: string) =>
    api.get<ReviewerBlogItem[]>("/api/reviewer/awaitingauthorblogs", {
      params: { userId, email, role: "Reviewer" },
    }),

  getBlogForReview: (blogId: string) =>
    api.get<ReviewerBlogDetail>(`/api/reviewer/blog/editblog/${blogId}`),

  saveEdits: (blogId: string, userId: string, email: string, payload: SaveEditsPayload) =>
    api.put<{ message: string }>(`/api/reviewer/blog/editblog/save/${blogId}`, payload, {
      params: { userId, email, role: "Reviewer" },
    }),

  saveDraft: (blogId: string, userId: string, email: string, payload: SaveDraftPayload) =>
    api.put<{ message: string }>(`/api/reviewer/blog/savedraft/${blogId}`, payload, {
      params: { userId, email, role: "Reviewer" },
    }),

  sendFeedback: (userId: string, email: string, blogId: string, feedback: string) =>
    api.post<{ message: string }>(
      "/api/reviewer/feedbacktoauthor",
      { id: blogId, feedback },
      { params: { userId, email } },
    ),

  discardBlog: (
    blogId: string,
    userId: string,
    email: string,
    payload: { rating: number; reviewRemarks: string },
  ) =>
    api.post<{ message: string }>(`/api/reviewer/discardqueue/${blogId}`, payload, {
      params: { userId, email, role: "Reviewer" },
    }),
};

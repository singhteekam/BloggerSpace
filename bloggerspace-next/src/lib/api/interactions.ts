import { api } from "./client";

export type CommentReply = {
  _id: string;
  replyCommentContent: string;
  replyCommentUser: {
    email: string;
    userName: string;
    profilePicture?: string;
  };
  commentLikes: string[];
  createdAt: string;
};

export type CommentItem = {
  _id: string;
  content: string;
  userEmail: string;
  userName: string;
  profilePicture?: string;
  commentLikes: string[];
  createdAt: string;
  commentReplies: CommentReply[];
};

export type LikeToggleResponse = {
  liked: boolean;
  likeCount: number;
};

export const interactionsApi = {
  toggleLike: (blogId: string, userId: string) =>
    api.post<LikeToggleResponse>(`/api/blogs/${blogId}/like`, {}, { params: { userId } }),

  getLikeStatus: (blogId: string, userId?: string) =>
    api.get<LikeToggleResponse>(`/api/blogs/${blogId}/likecheck`, { params: userId ? { userId } : {} }),

  saveBlog: (userId: string, payload: { title: string; slug: string; category: string; tags: string[] }) =>
    api.patch<{ message: string }>("/api/users/addtosavedblogs", payload, { params: { userId } }),

  unsaveBlog: (userId: string, slug: string) =>
    api.delete<{ message: string }>(`/api/users/removefromsavedblogs/${slug}`, { params: { userId } }),

  getSavedSlugs: (userId: string) =>
    api.get<{ slug: string }[]>("/api/users/savedblogs", { params: { userId } }),

  // Comments
  getComments: (slug: string) =>
    api.get<CommentItem[]>(`/api/blogs/${slug}/comments`),

  // userId must be in BOTH body (controller reads req.body.userId) AND
  // query params (authenticate middleware reads req.query.userId)
  postComment: (slug: string, userId: string, content: string) =>
    api.post<CommentItem[]>(`/api/blogs/${slug}/comments`, { content, userId }, { params: { userId } }),

  postReply: (slug: string, userId: string, repliedToCommentId: string, replyCommentContent: string) =>
    api.post(`/api/blogs/${slug}/comments/reply`, { repliedToCommentId, replyCommentContent }, { params: { userId } }),
};

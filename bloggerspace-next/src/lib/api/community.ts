import { api } from "./client";

export type CommunityAuthor = {
  _id: string;
  userName: string;
  fullName?: string;
  profilePicture?: string;
};

export type CommunityReply = {
  _id: string;
  replyCommunityPostContent: string;
  replyCommunityPostAuthor: CommunityAuthor;
  createdAt: string;
  lastUpdatedAt?: string;
};

export type CommunityPost = {
  _id: string;
  communityPostId: string;
  communityPostSlug: string;
  communityPostTopic: string;
  communityPostContent?: string; // not included in list responses — only in detail
  communityPostCategory?: string;
  communityPostAuthor: CommunityAuthor;
  communityPostComments: CommunityReply[];
  communityPostStatus?: string;
  lastUpdatedAt: string;
  createdAt?: string;
};

export type CommunityPostsPage = {
  posts: CommunityPost[];
  total: number;
  page: number;
  pages: number;
};

export const communityApi = {
  getPosts: (page = 1, limit = 20) =>
    api.get<CommunityPostsPage>("/api/community/communityposts", { params: { page, limit } }),

  // Backend route: GET /api/community/post/:communityPostSlug
  getPost: (slug: string) =>
    api.get<CommunityPost>(`/api/community/post/${slug}`),

  createPost: (
    userId: string,
    data: {
      communityPostSlug: string;
      communityPostTopic: string;
      communityPostCategory: string;
      communityPostContent: string;
    },
  ) =>
    api.post<CommunityPost>("/api/community/newpost", data, { params: { userId } }),

  // Backend route: POST /api/community/:communityPostId/addreply
  addReply: (
    communityPostId: string,
    userId: string,
    data: { communityPostContent: string },
  ) =>
    api.post<CommunityReply>(
      `/api/community/${communityPostId}/addreply`,
      data,
      { params: { userId } },
    ),
};

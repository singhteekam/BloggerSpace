import { api } from "./client";
import type { AuthUser } from "./auth";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export type PublicBlog = {
  _id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  blogViews: number;
  blogLikes: { userId: string }[];
  createdAt: string;
  lastUpdatedAt: string;
};

export type PublicProfile = {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  profilePicture?: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  blogs: PublicBlog[];
  createdAt: string;
};

export async function fetchPublicProfile(
  username: string,
  viewerId?: string,
): Promise<PublicProfile | null> {
  try {
    const url = viewerId
      ? `${BASE}/api/users/profile/${username}?viewerId=${viewerId}`
      : `${BASE}/api/users/profile/${username}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type SavedBlog = {
  title: string;
  slug: string;
  category: string;
  tags: string[];
};

export const userApi = {
  getInfo: () =>
    api.get<AuthUser>("/api/users/userinfo"),

  updateProfile: (userId: string, data: { fullName: string; userName: string }) =>
    api.patch<{ message: string; user: AuthUser }>(
      `/api/users/updateusername?userId=${userId}`,
      data,
    ),

  uploadProfilePicture: (userId: string, file: File) => {
    const form = new FormData();
    form.append("profilePicture", file);
    return api.post(`/api/users/uploadprofilepicture?userId=${userId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  checkUsername: (userName: string) =>
    api.post("/api/users/checkusername", { userName }),

  getSavedBlogs: (userId: string) =>
    api.get<SavedBlog[]>(`/api/users/savedblogs?userId=${userId}`),

  addToSaved: (userId: string, data: SavedBlog) =>
    api.patch(`/api/users/addtosavedblogs?userId=${userId}`, data),

  removeFromSaved: (slug: string, userId: string) =>
    api.delete(`/api/users/removefromsavedblogs/${slug}?userId=${userId}`),

  deactivateAccount: (userId: string) =>
    api.patch<{ message: string }>(`/api/users/deactivate?userId=${userId}`),

  deleteAccount: (userId: string) =>
    api.delete<{ message: string }>(`/api/users/delete?userId=${userId}`),

  follow: (targetId: string) =>
    api.patch<{ message: string }>(`/api/users/follow/${targetId}`),

  unfollow: (targetId: string) =>
    api.patch<{ message: string }>(`/api/users/unfollow/${targetId}`),

  getFollowStatus: (targetId: string, viewerId?: string) =>
    api.get<{ isFollowing: boolean }>(`/api/users/followstatus/${targetId}`, {
      params: viewerId ? { viewerId } : {},
    }),
};

export type UserGemsTransaction = {
  _id: string;
  blogTitle: string;
  blogSlug: string;
  type: "AWARD" | "DEDUCT";
  role: "AUTHOR" | "REVIEWER";
  amount: number;
  createdAt: string;
};

export const userGemsApi = {
  getHistory: (page = 1) =>
    api.get<{ transactions: UserGemsTransaction[]; total: number; page: number; pages: number }>(
      "/api/users/gems/history",
      { params: { page, limit: 20 } },
    ),
};

export const myBlogsApi = {
  getDrafts: (userId: string) =>
    api.get<import("@/types/blog").Blog[]>(`/api/blogs/myblogs/saveddraft?userId=${userId}`),

  getPending: (userId: string) =>
    api.get<import("@/types/blog").Blog[]>(`/api/blogs/myblogs/pendingreview?userId=${userId}`),

  getUnderReview: (userId: string) =>
    api.get<import("@/types/blog").Blog[]>(`/api/blogs/myblogs/underreview?userId=${userId}`),

  getAwaitingAuthor: (userId: string) =>
    api.get<import("@/types/blog").Blog[]>(`/api/blogs/myblogs/awaitingauthorblogs?userId=${userId}`),

  getPublished: (userId: string) =>
    api.get<import("@/types/blog").Blog[]>(`/api/blogs/myblogs/authorpublishedblogs?userId=${userId}`),

  discard: (blogId: string, userId: string, data: { authorEmail: string; slug: string }) =>
    api.post(`/api/users/discard/blog/${blogId}?userId=${userId}`, data),
};

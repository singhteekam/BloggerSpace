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
  blogScore?: number;
};

export type SocialLinks = {
  linkedin: string;
  github: string;
  website: string;
};

export type PublicProfile = {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  profilePicture?: string;
  isVerified: boolean;
  bio?: string;
  socialLinks?: SocialLinks;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  blogs: PublicBlog[];        // first page only (rest load via fetchProfileBlogs)
  blogsTotal?: number;        // total published blogs by this author
  blogsPageSize?: number;     // server page size used for the first page
  createdAt: string;
  // Phase 5 — public creator stats
  creatorScore?: number;
  creatorStats?: {
    scoredBlogCount: number;
    avg: number;
    best: number;
  };
  // Phase 6 — public reviewer stats
  reviewerScoreAvg?: number;
  reviewerScoreCount?: number;
  reviewerScoreBest?: number;
};

export async function fetchPublicProfile(
  username: string,
  viewerId?: string,
): Promise<PublicProfile | null> {
  try {
    const url = viewerId
      ? `${BASE}/api/users/profile/${username}?viewerId=${viewerId}`
      : `${BASE}/api/users/profile/${username}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type ProfileBlogsResponse = { blogs: PublicBlog[]; total: number; page: number; pages: number };

// Client-side "load more" for a profile's published blogs (page 2+).
export async function fetchProfileBlogs(username: string, page: number): Promise<ProfileBlogsResponse> {
  const res = await api.get<ProfileBlogsResponse>(
    `/api/users/profile/${encodeURIComponent(username)}/blogs`,
    { params: { page, limit: 12 } },
  );
  return res.data;
}

export type SavedBlog = {
  title: string;
  slug: string;
  category: string;
  tags: string[];
};

// Paginated saved-blogs response. Server-side `search` filters across ALL the
// user's saved blogs (title/category), then returns one page.
export type SavedBlogsResponse = {
  blogs: SavedBlog[];
  total: number;
  page: number;
  pages: number;
};
export type SavedBlogsParams = { page?: number; limit?: number; search?: string };

export type ReadingHistoryItem = {
  blogId?: number;
  slug: string;
  title: string;
  category: string;
  readAt: string;
};

export const userApi = {
  getInfo: () =>
    api.get<AuthUser>("/api/users/userinfo"),

  updateProfile: (
    userId: string,
    data: { fullName: string; userName: string; bio?: string; socialLinks?: SocialLinks },
  ) =>
    api.patch<{ message: string; user: AuthUser }>(
      `/api/users/updateusername?userId=${userId}`,
      data,
    ),

  setNewsletterOptIn: (optIn: boolean) =>
    api.patch<{ message: string; newsletterOptIn: boolean }>(
      "/api/users/newsletter-optin",
      { optIn },
    ),

  addReadingHistory: (data: { blogId?: number; slug: string; title: string; category: string }) =>
    api.post<{ ok: boolean; deduped?: boolean }>("/api/users/reading-history", data),

  getReadingHistory: () =>
    api.get<{ history: ReadingHistoryItem[] }>("/api/users/reading-history"),

  // ── Push notifications (FCM token) ──────────────────────────────────────────
  registerPushToken: (token: string, userAgent = "") =>
    api.post<{ ok: boolean; enabled: boolean }>("/api/notifications/register", { token, userAgent }),

  unregisterPushToken: (token: string) =>
    api.post<{ ok: boolean; enabled: boolean }>("/api/notifications/unregister", { token }),

  getPushStatus: (token: string) =>
    api.get<{ enabled: boolean }>("/api/notifications/status", { params: { token } }),

  uploadProfilePicture: (userId: string, file: File) => {
    const form = new FormData();
    form.append("profilePicture", file);
    return api.post(`/api/users/uploadprofilepicture?userId=${userId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  checkUsername: (userName: string) =>
    api.post("/api/users/checkusername", { userName }),

  getSavedBlogs: (userId: string, params: SavedBlogsParams = {}) =>
    api.get<SavedBlogsResponse>("/api/users/savedblogs", { params: { userId, ...params } }),

  addToSaved: (userId: string, data: SavedBlog) =>
    api.patch(`/api/users/addtosavedblogs?userId=${userId}`, data),

  removeFromSaved: (slug: string, userId: string) =>
    api.delete(`/api/users/removefromsavedblogs/${slug}?userId=${userId}`),

  deactivateAccount: (userId: string) =>
    api.patch<{ message: string }>(`/api/users/deactivate?userId=${userId}`),

  // No userId param — the server derives the account from the auth token so a
  // user can only ever delete their own account.
  deleteAccount: () =>
    api.delete<{ message: string }>("/api/users/delete"),

  follow: (targetId: string) =>
    api.patch<{ message: string }>(`/api/users/follow/${targetId}`),

  unfollow: (targetId: string) =>
    api.patch<{ message: string }>(`/api/users/unfollow/${targetId}`),

  getFollowStatus: (targetId: string, viewerId?: string) =>
    api.get<{ isFollowing: boolean }>(`/api/users/followstatus/${targetId}`, {
      params: viewerId ? { viewerId } : {},
    }),

  // List the users in someone's followers / following set.
  getFollowList: (userId: string, type: "followers" | "following") =>
    api.get<{ users: FollowListUser[] }>(`/api/users/follow-list/${userId}`, {
      params: { type },
    }),
};

export type FollowListUser = {
  _id: string;
  userName: string;
  fullName: string;
  profilePicture?: string;
  isVerified?: boolean;
};

export type UserGemsTransaction = {
  _id: string;
  blogTitle?: string;
  blogSlug?: string;
  type: "AWARD" | "DEDUCT";
  role?: "AUTHOR" | "REVIEWER";
  amount: number;
  source?:
    | "BLOG_AWARD"
    | "ADMIN_GRANT"
    | "ADMIN_GRANT_REVERSE"
    | "REDEMPTION_DEDUCT"
    | "REDEMPTION_REFUND";
  note?: string;
  createdAt: string;
};

export const userGemsApi = {
  getHistory: (page = 1) =>
    api.get<{ transactions: UserGemsTransaction[]; total: number; page: number; pages: number }>(
      "/api/users/gems/history",
      { params: { page, limit: 20 } },
    ),
};

// ── Redemption requests (Phase 4) ───────────────────────────────────────────
export type RedemptionMethod = "AMAZON_GIFT_CARD" | "FLIPKART_GIFT_CARD";

export const REDEMPTION_METHOD_LABELS: Record<RedemptionMethod, string> = {
  AMAZON_GIFT_CARD: "Amazon Pay gift card",
  FLIPKART_GIFT_CARD: "Flipkart gift card",
};

export type RedemptionRequestRecord = {
  _id: string;
  userId: string;
  gemsAmount: number;
  valueInPaise: number;
  method: RedemptionMethod;
  recipientEmail: string;
  status: "PENDING" | "FULFILLED" | "REJECTED";
  isFlagged: boolean;
  flagReason: string;
  fulfilledAt?: string | null;
  fulfillmentNote?: string;
  rejectedAt?: string | null;
  rejectionReason?: string;
  createdAt: string;
};

export type RedemptionListResponse = {
  requests: RedemptionRequestRecord[];
  total: number;
  pendingCount: number;
  cooldownDaysLeft: number;
  page: number;
  pages: number;
  config: {
    gemValuePaise: number;
    minRedeemGems: number;
    maxRedeemGems: number;
    redemptionCooldownDays: number;
    methods: string[];
  };
};

export const redemptionApi = {
  create: (amount: number, method: RedemptionMethod) =>
    api.post<{ message: string; balance: number; request: RedemptionRequestRecord }>(
      "/api/users/redemptions",
      { amount, method },
    ),

  listMine: (page = 1) =>
    api.get<RedemptionListResponse>("/api/users/redemptions/me", {
      params: { page, limit: 10 },
    }),
};

// Paginated MyBlogs response. Server-side `search` filters across ALL the
// author's blogs of that status (title/category), then returns one page.
export type MyBlogsResponse = {
  blogs: import("@/types/blog").Blog[];
  total: number;
  page: number;
  pages: number;
};
export type MyBlogsParams = { page?: number; limit?: number; search?: string };

export const myBlogsApi = {
  getDrafts: (userId: string, params: MyBlogsParams = {}) =>
    api.get<MyBlogsResponse>("/api/blogs/myblogs/saveddraft", { params: { userId, ...params } }),

  getPending: (userId: string, params: MyBlogsParams = {}) =>
    api.get<MyBlogsResponse>("/api/blogs/myblogs/pendingreview", { params: { userId, ...params } }),

  getUnderReview: (userId: string, params: MyBlogsParams = {}) =>
    api.get<MyBlogsResponse>("/api/blogs/myblogs/underreview", { params: { userId, ...params } }),

  getAwaitingAuthor: (userId: string, params: MyBlogsParams = {}) =>
    api.get<MyBlogsResponse>("/api/blogs/myblogs/awaitingauthorblogs", { params: { userId, ...params } }),

  getPublished: (userId: string, params: MyBlogsParams = {}) =>
    api.get<MyBlogsResponse>("/api/blogs/myblogs/authorpublishedblogs", { params: { userId, ...params } }),

  discard: (blogId: string, userId: string, data: { authorEmail: string; slug: string }) =>
    api.post(`/api/users/discard/blog/${blogId}?userId=${userId}`, data),
};

import { api } from "./client";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  _id: string;
  userId?: string | null;
  fullName: string;
  userName: string;
  profilePicture?: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  rejectionReason?: string;
  approvedAt?: string | null;
  createdAt: string;
};

export type ReviewListResponse = {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
  pendingCount?: number;
};

export type MyReviewResponse = {
  review: Pick<Review, "status" | "rating" | "body" | "rejectionReason" | "createdAt"> | null;
};

// ── Server-side fetch (used in page.tsx server component) ────────────────────
export async function fetchApprovedReviews(
  page = 1,
  limit = 9,
): Promise<{ reviews: Review[]; total: number; pages: number }> {
  try {
    const res = await fetch(
      `${BASE}/api/reviews/approved?page=${page}&limit=${limit}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return { reviews: [], total: 0, pages: 0 };
    return await res.json();
  } catch {
    return { reviews: [], total: 0, pages: 0 };
  }
}

// ── Client-side API ──────────────────────────────────────────────────────────
export const reviewsApi = {
  getApproved: (page = 1, limit = 12) =>
    api.get<{ reviews: Review[]; total: number; page: number; pages: number }>(
      "/api/reviews/approved",
      { params: { page, limit } },
    ),

  getMyReview: () =>
    api.get<MyReviewResponse>("/api/reviews/me"),

  create: (rating: number, body: string) =>
    api.post<{ message: string; review: Review }>("/api/reviews", { rating, body }),
};

// ── Admin API ────────────────────────────────────────────────────────────────
export const adminReviewsApi = {
  list: (status: ReviewStatus | "all" = "pending", page = 1) =>
    api.get<ReviewListResponse>("/api/reviews/admin", { params: { status, page, limit: 20 } }),

  approve: (id: string) =>
    api.patch<{ message: string; review: Review }>(`/api/reviews/admin/${id}/approve`),

  reject: (id: string, reason = "") =>
    api.patch<{ message: string; review: Review }>(`/api/reviews/admin/${id}/reject`, { reason }),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/reviews/admin/${id}`),
};

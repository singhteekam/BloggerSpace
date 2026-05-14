import { api } from "./client";

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  userName?: string;
  isVerified?: boolean;
  createdAt?: string;
};

/** Shape returned by POST /api/users/login */
export type AuthResponse = {
  message: string;
  token: string;
  userDetails: AuthUser;
  previousLogin?: string;
};

/** Shape returned by POST /api/users/signup */
export type SignupResponse = {
  message: string;
};

/** Shape returned by POST /api/reviewer/login */
export type ReviewerAuthResponse = {
  message: string;
  token: string;
  reviewerDetails: AuthUser;
};

export type LoginPayload = { email: string; password: string };
export type SignupPayload = { fullName: string; email: string; password: string };

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/api/users/login", data),

  signup: (data: SignupPayload) =>
    api.post<SignupResponse>("/api/users/signup", data),

  forgotPassword: (email: string) =>
    api.post("/api/users/forgotpassword", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post("/api/users/resetpassword", { token, newPassword }),

  reviewerLogin: (data: LoginPayload) =>
    api.post<ReviewerAuthResponse>("/api/reviewer/login", data),
};

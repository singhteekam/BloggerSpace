import { api } from "./client";

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  userName?: string;
  isVerified?: boolean;
  status?: string;
  reviewerStatus?: "none" | "pending" | "approved" | "rejected";
  gems?: number;
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

export type LoginPayload = { email: string; password: string };
export type SignupPayload = { fullName: string; email: string; password: string };

/** Returned by POST /api/users/signup and POST /api/users/login when email is unverified */
export type OtpRequiredResponse = {
  message: "otp_required";
  email: string;
  info: string;
};

/** Returned by POST /api/users/verify-otp on success — logs the user in */
export type VerifyOtpResponse = {
  message: string;
  token: string;
  userDetails: AuthUser;
};

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/api/users/login", data),

  signup: (data: SignupPayload) =>
    api.post<OtpRequiredResponse>("/api/users/signup", data),

  verifyOtp: (email: string, otp: string) =>
    api.post<VerifyOtpResponse>("/api/users/verify-otp", { email, otp }),

  resendOtp: (email: string) =>
    api.post<{ message: string }>("/api/users/resend-otp", { email }),

  // Passwordless OTP login
  requestLoginOtp: (email: string) =>
    api.post<{ message: string; info: string }>("/api/users/login-otp/request", { email }),

  verifyLoginOtp: (email: string, otp: string) =>
    api.post<AuthResponse>("/api/users/login-otp/verify", { email, otp }),

  // Forgot password via OTP
  forgotPasswordRequestOtp: (email: string) =>
    api.post<{ message: string; info: string }>("/api/users/forgot-password/request-otp", { email }),

  forgotPasswordVerifyOtp: (email: string, otp: string) =>
    api.post<{ message: string; resetToken: string }>("/api/users/forgot-password/verify-otp", { email, otp }),

  forgotPasswordReset: (resetToken: string, newPassword: string) =>
    api.post<{ message: string }>("/api/users/forgot-password/reset", { resetToken, newPassword }),

  // Legacy link-based forgot password (kept for backward compat)
  forgotPassword: (email: string) =>
    api.post("/api/users/forgotpassword", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post("/api/users/resetpassword", { token, newPassword }),

  reviewerApply: (motivation?: string) =>
    api.post<{ message: string }>("/api/reviewer/apply", { motivation }),
};

import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "@/lib/env";
import { authStorage } from "@/lib/api/auth-storage";

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.NEXT_PUBLIC_BACKEND_URL,
    timeout: 30_000,
    withCredentials: false,
  });

  // NEW- Attach Bearer JWT token from localStorage on every request.
  // Server middlewares now verify this token and set req.query.userId from the payload.
  instance.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ code?: string; message?: string }>) => {
      if (typeof window === "undefined") return Promise.reject(error);

      // 401 — token rejected (expired or revoked). Clear auth and redirect to login.
      if (error.response?.status === 401 && authStorage.getToken()) {
        authStorage.clear();
        const isAdminPath = window.location.pathname.startsWith("/admin");
        const msg = error.response.data?.message ?? "";
        const isDeactivated = msg === "Account deactivated. Please contact support.";
        const loginBase = isAdminPath ? "/admin/login" : "/login";
        window.location.href = isDeactivated ? `${loginBase}?reason=deactivated` : loginBase;
        return Promise.reject(error);
      }

      // 403 REVERIFICATION_REQUIRED — periodic re-verification is due.
      // Clear the token so the user must go through re-verification before regaining access.
      if (
        error.response?.status === 403 &&
        error.response.data?.code === "REVERIFICATION_REQUIRED" &&
        authStorage.getToken()
      ) {
        const cached = authStorage.getUserCache<{ email?: string }>();
        const email = cached?.email ?? "";
        authStorage.clear();
        const params = email ? `?email=${encodeURIComponent(email)}` : "";
        window.location.href = `/reverify${params}`;
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export const api = createApiClient();

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
    (error: AxiosError) => {
      // If we had a stored token but the server rejected it (401), the admin
      // revoked access or the token expired. Clear auth and redirect to login.
      if (error.response?.status === 401 && authStorage.getToken()) {
        authStorage.clear();
        if (typeof window !== "undefined") {
          const isAdminPath = window.location.pathname.startsWith("/admin");
          window.location.href = isAdminPath ? "/admin/login" : "/login";
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const api = createApiClient();

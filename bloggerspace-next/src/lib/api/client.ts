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
    (error: AxiosError) => Promise.reject(error),
  );

  return instance;
}

export const api = createApiClient();

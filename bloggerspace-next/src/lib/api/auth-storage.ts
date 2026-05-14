const TOKEN_KEY = "bs.token";
const USER_KEY = "bs.user";

const isBrowser = () => typeof window !== "undefined";

export const authStorage = {
  getToken(): string | null {
    if (!isBrowser()) return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore (e.g., quota, private mode)
    }
  },
  clear(): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  },
  getUserCache<T = unknown>(): T | null {
    if (!isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  setUserCache(user: unknown): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },
};

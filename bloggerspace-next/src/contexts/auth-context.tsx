"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authStorage } from "@/lib/api/auth-storage";
import type { AuthUser } from "@/lib/api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = authStorage.getToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    const storedUser = authStorage.getUserCache<AuthUser>();
    if (storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      // Token exists but cached user is missing or corrupted — clear stale token
      // so the user lands on a clean login page rather than a half-broken state.
      authStorage.clear();
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    authStorage.setToken(newToken);
    authStorage.setUserCache(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

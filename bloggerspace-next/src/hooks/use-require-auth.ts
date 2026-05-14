"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/**
 * Redirects to /login if the user is not authenticated.
 * Use at the top of any client component that requires auth.
 * Returns the auth state so you can gate rendering.
 */
export function useRequireAuth(redirectTo = "/login") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

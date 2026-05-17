"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function useRequireReviewer(redirectTo = "/login") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role?.toLowerCase() !== "reviewer")) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

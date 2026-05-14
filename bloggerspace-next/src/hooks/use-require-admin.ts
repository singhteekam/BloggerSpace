"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function useRequireAdmin(redirectTo = "/admin/login") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "Admin")) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

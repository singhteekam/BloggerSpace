"use client";

import { useQuery } from "@tanstack/react-query";
import { adminConfigApi, type AdminConfigDoc } from "@/lib/api/admin";

/**
 * Shared admin-config fetch. React Query dedupes the request across all
 * components mounted with the same key, so multiple pages calling this in
 * the same session result in just one network call.
 *
 * Returns the config with safe fallbacks while loading so callers can
 * always read concrete numbers (no undefined checks at every use site).
 */
export function useAdminConfig(adminId: string | null | undefined) {
  return useQuery<AdminConfigDoc>({
    queryKey: ["admin-config", adminId],
    queryFn: () => adminConfigApi.get(adminId!).then((r) => r.data),
    enabled: !!adminId,
    staleTime: 5 * 60 * 1000, // config rarely changes — 5 min cache
  });
}

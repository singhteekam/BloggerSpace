"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";

/**
 * Live follower count for the author card on the (ISR-cached) blog page — keeps the
 * number fresh instead of showing the days-old server-rendered value. Shares the
 * React Query key `["followerCount", targetId]` with FollowButton, so following /
 * unfollowing this author updates the count instantly. Backend-only: no Vercel cost.
 */
export function LiveFollowerCount({
  targetId,
  initialCount,
}: {
  targetId: string;
  initialCount: number;
}) {
  const { user } = useAuth();
  const { data: count = initialCount } = useQuery({
    queryKey: ["followerCount", targetId],
    queryFn: () =>
      userApi.getFollowStatus(targetId, user?._id).then((r) => r.data.followersCount ?? initialCount),
    initialData: initialCount,
    staleTime: 30_000,
  });

  return (
    <>
      {count.toLocaleString()} follower{count !== 1 ? "s" : ""}
    </>
  );
}

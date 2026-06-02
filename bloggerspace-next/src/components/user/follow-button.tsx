"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
import { interactionCache } from "@/lib/api/interaction-cache";
import { cn } from "@/lib/utils/cn";

type Props = {
  targetId: string;
  initialFollowing?: boolean;
  onCountChange?: (delta: number) => void;
  className?: string;
};

export function FollowButton({ targetId, initialFollowing, onCountChange, className }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?._id;

  // Seed instantly from SSR (`initialFollowing`) or localStorage, then React
  // Query reconciles with the live DB value (the profile page is ISR-cached, so
  // the SSR value can be stale) and caches it across navigation.
  const seeded =
    initialFollowing ??
    interactionCache.isFollowing(uid, targetId) ??
    false;
  const followKey = ["followStatus", targetId, uid] as const;

  const { data: following = seeded, isFetched } = useQuery({
    queryKey: followKey,
    queryFn: () =>
      userApi.getFollowStatus(targetId, uid).then((r) => {
        interactionCache.setFollowing(uid, targetId, r.data.isFollowing);
        return r.data.isFollowing;
      }),
    enabled: !!user && user._id !== targetId,
    placeholderData: seeded,
    staleTime: 30 * 1000,
  });

  if (!user || user._id === targetId) return null;
  // Avoid a wrong-state flash only when we have nothing to seed with.
  if (initialFollowing === undefined && interactionCache.isFollowing(uid, targetId) === undefined && !isFetched) {
    return null;
  }

  const handleToggle = async () => {
    const wasFollowing = following;
    qc.setQueryData(followKey, !wasFollowing);
    interactionCache.setFollowing(uid, targetId, !wasFollowing);
    onCountChange?.(wasFollowing ? -1 : 1);
    try {
      if (wasFollowing) {
        await userApi.unfollow(targetId);
        toast.success("Unfollowed.");
      } else {
        await userApi.follow(targetId);
        toast.success("Following!");
      }
    } catch {
      qc.setQueryData(followKey, wasFollowing); // revert
      interactionCache.setFollowing(uid, targetId, wasFollowing);
      onCountChange?.(wasFollowing ? 1 : -1);
      toast.error("Failed. Try again.");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-60",
        following
          ? "border border-border bg-muted text-foreground hover:border-destructive hover:text-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {following ? (
        <><UserCheck className="size-3.5" />Following</>
      ) : (
        <><UserPlus className="size-3.5" />Follow</>
      )}
    </button>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
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

  // Seed instantly from SSR / localStorage, reconcile with the live DB value.
  // The button is DISABLED until that live status settles (so the user never
  // toggles from an unconfirmed state) and during the follow/unfollow request.
  const seeded =
    initialFollowing ??
    interactionCache.isFollowing(uid, targetId) ??
    false;
  const followKey = ["followStatus", targetId, uid] as const;

  // Keep a live follower count (LiveFollowerCount, keyed by targetId) in sync when
  // this viewer follows/unfollows — only adjusts the cache if a count is mounted.
  const bumpFollowerCount = (delta: number) =>
    qc.setQueryData<number>(["followerCount", targetId], (c) =>
      typeof c === "number" ? Math.max(0, c + delta) : c,
    );

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

  const mutation = useMutation({
    mutationFn: (wasFollowing: boolean) =>
      wasFollowing ? userApi.unfollow(targetId) : userApi.follow(targetId),
    onMutate: (wasFollowing: boolean) => {
      qc.setQueryData(followKey, !wasFollowing);
      interactionCache.setFollowing(uid, targetId, !wasFollowing);
      bumpFollowerCount(wasFollowing ? -1 : 1);
      onCountChange?.(wasFollowing ? -1 : 1);
      return { wasFollowing };
    },
    onError: (_e, wasFollowing) => {
      qc.setQueryData(followKey, wasFollowing);
      interactionCache.setFollowing(uid, targetId, wasFollowing);
      bumpFollowerCount(wasFollowing ? 1 : -1);
      onCountChange?.(wasFollowing ? 1 : -1);
      toast.error("Failed. Try again.");
    },
    onSuccess: (_d, wasFollowing) => toast.success(wasFollowing ? "Unfollowed." : "Following!"),
  });

  if (!user || user._id === targetId) return null;

  // Disabled until the live status has confirmed at least once, and during the toggle.
  const busy = !isFetched || mutation.isPending;

  return (
    <button
      onClick={() => !busy && mutation.mutate(following)}
      disabled={busy}
      aria-busy={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60",
        following
          ? "border border-border bg-muted text-foreground hover:border-destructive hover:text-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {mutation.isPending ? (
        <><Loader2 className="size-3.5 animate-spin" />{following ? "Following" : "Follow"}</>
      ) : following ? (
        <><UserCheck className="size-3.5" />Following</>
      ) : (
        <><UserPlus className="size-3.5" />Follow</>
      )}
    </button>
  );
}

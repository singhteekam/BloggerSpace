"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
import { cn } from "@/lib/utils/cn";

type Props = {
  targetId: string;
  initialFollowing?: boolean;
  onCountChange?: (delta: number) => void;
  className?: string;
};

export function FollowButton({ targetId, initialFollowing, onCountChange, className }: Props) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(initialFollowing !== undefined);

  // Always reconcile with the live DB status. The profile page is ISR-cached
  // (revalidate 24h), so the SSR `initialFollowing` can be stale — e.g. after
  // you follow then refresh. We paint with the SSR value first (if given) and
  // then correct it from the server, mirroring the like button's behaviour.
  useEffect(() => {
    if (!user || user._id === targetId) {
      setResolved(true);
      return;
    }
    userApi.getFollowStatus(targetId, user._id)
      .then((r) => { setFollowing(r.data.isFollowing); setResolved(true); })
      .catch(() => setResolved(true)); // keep SSR/last value on failure
  }, [targetId, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || user._id === targetId) return null;
  if (!resolved) return null;

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
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
      setFollowing(wasFollowing);
      onCountChange?.(wasFollowing ? 1 : -1);
      toast.error("Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
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

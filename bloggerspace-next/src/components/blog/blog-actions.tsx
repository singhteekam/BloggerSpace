"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/auth-context";
import { interactionsApi } from "@/lib/api/interactions";
import { adminApi } from "@/lib/api/admin";
import { interactionCache } from "@/lib/api/interaction-cache";

type Props = {
  blogId: string;
  blogSlug: string;
  blogTitle: string;
  blogCategory: string;
  blogTags: string[];
  initialLikes: { userId: string }[];
};

export function BlogActions({ blogId, blogSlug, blogTitle, blogCategory, blogTags, initialLikes }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "Admin";
  const uid = user?._id;

  // ── Like state ──────────────────────────────────────────────────────────────
  // Seed instantly from SSR (the blog HTML already carries `initialLikes`) so the
  // correct state paints immediately, then React Query reconciles with the live
  // DB value (bypasses the 24h ISR cache) and caches it across navigation.
  const seededLiked = uid ? initialLikes.some((l) => l.userId === uid) : false;
  const likeKey = ["likeStatus", blogId, uid] as const;
  const { data: likeData } = useQuery({
    queryKey: likeKey,
    queryFn: () => interactionsApi.getLikeStatus(blogId, uid).then((r) => r.data),
    enabled: !!blogId,
    placeholderData: { liked: seededLiked, likeCount: initialLikes.length },
    staleTime: 30 * 1000,
  });
  const liked = likeData?.liked ?? seededLiked;
  const likeCount = likeData?.likeCount ?? initialLikes.length;

  // ── Saved state ─────────────────────────────────────────────────────────────
  // One shared query holds ALL of the user's saved slugs, so every blog page
  // reads the save state from the same cache (instant after the first load).
  // `initialData` seeds it from localStorage so it's correct even on a hard
  // refresh before the network responds.
  const savedKey = ["savedSlugs", uid, isAdmin] as const;
  const { data: savedSlugs } = useQuery({
    queryKey: savedKey,
    queryFn: async () => {
      const r = isAdmin
        ? await adminApi.getAdminSavedBlogs(uid!)
        : await interactionsApi.getSavedSlugs(uid!);
      const slugs = r.data.map((s) => s.slug);
      interactionCache.setSavedSlugs(uid, slugs); // persist for the next refresh
      return slugs;
    },
    enabled: !!uid,
    initialData: () => interactionCache.getSavedSlugs(uid),
    staleTime: 60 * 1000,
  });
  const saved = (savedSlugs ?? []).includes(blogSlug);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like posts."); return; }
    const prev = { liked, likeCount };
    // Optimistic: flip immediately in the cache.
    qc.setQueryData(likeKey, { liked: !liked, likeCount: liked ? likeCount - 1 : likeCount + 1 });
    try {
      const r = await interactionsApi.toggleLike(blogId, user._id);
      qc.setQueryData(likeKey, r.data);
    } catch {
      qc.setQueryData(likeKey, prev); // revert
      toast.error("Failed to update like.");
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Sign in to save posts."); return; }
    const wasSaved = saved;
    // Optimistic: update the shared saved-slugs cache + localStorage now.
    const next = wasSaved
      ? (savedSlugs ?? []).filter((s) => s !== blogSlug)
      : [...(savedSlugs ?? []), blogSlug];
    qc.setQueryData(savedKey, next);
    interactionCache.setSavedSlugs(uid, next);
    try {
      if (wasSaved) {
        if (isAdmin) await adminApi.removeAdminSavedBlog(user._id, blogSlug);
        else await interactionsApi.unsaveBlog(user._id, blogSlug);
        toast.success("Removed from saved.");
      } else {
        const payload = { title: blogTitle, slug: blogSlug, category: blogCategory, tags: blogTags };
        if (isAdmin) await adminApi.addAdminSavedBlog(user._id, payload);
        else await interactionsApi.saveBlog(user._id, payload);
        toast.success("Saved!");
      }
    } catch (err) {
      qc.setQueryData(savedKey, savedSlugs ?? []); // revert
      interactionCache.setSavedSlugs(uid, savedSlugs ?? []);
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error.");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLike}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
          liked
            ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart className={cn("size-4 transition-transform", liked && "fill-rose-500 scale-110")} />
        <span>{likeCount}</span>
      </button>

      <button
        onClick={handleSave}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
          saved
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
        aria-label={saved ? "Unsave" : "Save"}
      >
        <Bookmark className={cn("size-4 transition-transform", saved && "fill-primary scale-110")} />
        <span>{saved ? "Saved" : "Save"}</span>
      </button>
    </div>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark, Loader2 } from "lucide-react";
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
  // Seed instantly from SSR, then reconcile with the live DB value. The button
  // stays DISABLED until that first live fetch settles (so the user never acts
  // on an unconfirmed state) and during the toggle itself (no double-clicks).
  const seededLiked = uid ? initialLikes.some((l) => l.userId === uid) : false;
  const likeKey = ["likeStatus", blogId, uid] as const;
  const { data: likeData, isFetched: likeFetched } = useQuery({
    queryKey: likeKey,
    queryFn: () => interactionsApi.getLikeStatus(blogId, uid).then((r) => r.data),
    enabled: !!blogId,
    placeholderData: { liked: seededLiked, likeCount: initialLikes.length },
    staleTime: 30 * 1000,
  });
  const liked = likeData?.liked ?? seededLiked;
  const likeCount = likeData?.likeCount ?? initialLikes.length;

  const likeMutation = useMutation({
    mutationFn: () => interactionsApi.toggleLike(blogId, uid!).then((r) => r.data),
    onMutate: () => {
      const prev = qc.getQueryData(likeKey);
      qc.setQueryData(likeKey, { liked: !liked, likeCount: liked ? likeCount - 1 : likeCount + 1 });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(likeKey, ctx.prev);
      toast.error("Failed to update like.");
    },
    onSuccess: (data) => {
      qc.setQueryData(likeKey, data);
      toast.success(data.liked ? "Added to your likes." : "Removed your like.");
    },
  });
  const likeBusy = !likeFetched || likeMutation.isPending;

  // ── Saved state ─────────────────────────────────────────────────────────────
  // One shared query holds ALL the user's saved slugs (seeded from localStorage
  // for an instant first paint). Disabled until it has loaded + during the toggle.
  const savedKey = ["savedSlugs", uid, isAdmin] as const;
  const { data: savedSlugs, isFetched: savedFetched } = useQuery({
    queryKey: savedKey,
    queryFn: async () => {
      const r = isAdmin
        ? await adminApi.getAdminSavedBlogs(uid!)
        : await interactionsApi.getSavedSlugs(uid!);
      const slugs = r.data.map((s) => s.slug);
      interactionCache.setSavedSlugs(uid, slugs);
      return slugs;
    },
    enabled: !!uid,
    initialData: () => interactionCache.getSavedSlugs(uid),
    staleTime: 60 * 1000,
  });
  const saved = (savedSlugs ?? []).includes(blogSlug);

  const saveMutation = useMutation({
    mutationFn: async (wasSaved: boolean) => {
      if (wasSaved) {
        if (isAdmin) await adminApi.removeAdminSavedBlog(uid!, blogSlug);
        else await interactionsApi.unsaveBlog(uid!, blogSlug);
      } else {
        const payload = { title: blogTitle, slug: blogSlug, category: blogCategory, tags: blogTags };
        if (isAdmin) await adminApi.addAdminSavedBlog(uid!, payload);
        else await interactionsApi.saveBlog(uid!, payload);
      }
    },
    onMutate: (wasSaved: boolean) => {
      const prev = savedSlugs ?? [];
      const next = wasSaved ? prev.filter((s) => s !== blogSlug) : [...prev, blogSlug];
      qc.setQueryData(savedKey, next);
      interactionCache.setSavedSlugs(uid, next);
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) { qc.setQueryData(savedKey, ctx.prev); interactionCache.setSavedSlugs(uid, ctx.prev); }
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error.");
    },
    onSuccess: (_d, wasSaved) => toast.success(wasSaved ? "Removed from saved." : "Saved!"),
  });
  // Only gate on the saved query for logged-in users (it's disabled otherwise).
  const saveBusy = (!!uid && !savedFetched) || saveMutation.isPending;

  const onLike = () => {
    if (!user) { toast.error("Sign in to like posts."); return; }
    if (likeBusy) return;
    likeMutation.mutate();
  };
  const onSave = () => {
    if (!user) { toast.error("Sign in to save posts."); return; }
    if (saveBusy) return;
    saveMutation.mutate(saved);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onLike}
        disabled={likeBusy}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60",
          liked
            ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
        aria-label={liked ? "Unlike" : "Like"}
        aria-busy={likeBusy}
      >
        {likeMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Heart className={cn("size-4 transition-transform", liked && "fill-rose-500 scale-110")} />
        )}
        <span>{likeCount}</span>
      </button>

      <button
        onClick={onSave}
        disabled={saveBusy}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60",
          saved
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
        aria-label={saved ? "Unsave" : "Save"}
        aria-busy={saveBusy}
      >
        {saveMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bookmark className={cn("size-4 transition-transform", saved && "fill-primary scale-110")} />
        )}
        <span>{saved ? "Saved" : "Save"}</span>
      </button>
    </div>
  );
}

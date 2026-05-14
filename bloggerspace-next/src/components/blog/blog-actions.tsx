"use client";

import { useState, useEffect } from "react";
import { Heart, Bookmark } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/auth-context";
import { interactionsApi } from "@/lib/api/interactions";

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

  const [likeCount, setLikeCount] = useState(initialLikes.length);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liking, setLiking] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch live like status from DB to bypass Next.js cache
  useEffect(() => {
    interactionsApi.getLikeStatus(blogId, user?._id)
      .then((r) => {
        setLiked(r.data.liked);
        setLikeCount(r.data.likeCount);
      })
      .catch(() => {
        // Fallback to SSR data
        if (user) setLiked(initialLikes.some((l) => l.userId === user._id));
      });
  }, [blogId, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch saved state
  useEffect(() => {
    if (!user) return;
    interactionsApi.getSavedSlugs(user._id)
      .then((r) => setSaved(r.data.some((s) => s.slug === blogSlug)))
      .catch(() => {/* silent */});
  }, [user, blogSlug]);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like posts."); return; }
    if (liking) return;
    setLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      const r = await interactionsApi.toggleLike(blogId, user._id);
      setLiked(r.data.liked);
      setLikeCount(r.data.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
      toast.error("Failed to update like.");
    } finally {
      setLiking(false);
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Sign in to save posts."); return; }
    if (saving) return;
    setSaving(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        await interactionsApi.unsaveBlog(user._id, blogSlug);
        toast.success("Removed from saved.");
      } else {
        await interactionsApi.saveBlog(user._id, { title: blogTitle, slug: blogSlug, category: blogCategory, tags: blogTags });
        toast.success("Saved!");
      }
    } catch (err) {
      setSaved(wasSaved);
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLike}
        disabled={liking}
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
        disabled={saving}
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

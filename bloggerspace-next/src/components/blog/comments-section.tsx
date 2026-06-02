"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Send, CornerDownRight, Loader2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/html";
import { useAuth } from "@/contexts/auth-context";
import { interactionsApi, type CommentItem, type CommentReply } from "@/lib/api/interactions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils/cn";

type Props = { slug: string; initialCount: number };

export function CommentsSection({ slug, initialCount }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; displayName: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const loadComments = useCallback(() => {
    setLoading(true);
    interactionsApi.getComments(slug)
      .then((r) => setComments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { loadComments(); }, [loadComments]);

  useEffect(() => {
    if (replyingTo && replyRef.current) {
      replyRef.current.focus();
      const len = replyRef.current.value.length;
      replyRef.current.setSelectionRange(len, len);
    }
  }, [replyingTo]);

  const submitComment = async () => {
    if (!user) { toast.error("Sign in to comment."); return; }
    const text = newComment.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const res = await interactionsApi.postComment(slug, user._id, text);
      setComments(res.data);
      setNewComment("");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to post comment.") : "Error.");
    } finally {
      setSubmitting(false);
    }
  };

  const openReply = (commentId: string, displayName: string) => {
    setReplyingTo({ commentId, displayName });
    setReplyText(`@${displayName} `);
  };

  const closeReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const submitReply = async () => {
    if (!user || !replyingTo) return;
    const text = replyText.trim();
    if (!text) return;
    setReplySubmitting(true);
    try {
      const res = await interactionsApi.postReply(slug, user._id, replyingTo.commentId, text);
      setComments(res.data);
      closeReply();
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to post reply.") : "Error.");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight">
        <MessageSquare className="size-5 text-muted-foreground" />
        Comments
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          ({loading ? initialCount : comments.length})
        </span>
      </h2>

      {/* New comment input */}
      <div className="mb-8 space-y-2">
        <Textarea
          placeholder={user ? "Share your thoughts…" : "Sign in to leave a comment."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || submitting}
          rows={3}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitComment();
          }}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={submitComment} disabled={!user || submitting || !newComment.trim()}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Post comment
          </Button>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: Math.min(initialCount || 2, 3) }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              slug={slug}
              userId={user?._id}
              replyingTo={replyingTo}
              replyText={replyText}
              replyRef={replyRef}
              replySubmitting={replySubmitting}
              onOpenReply={openReply}
              onCloseReply={closeReply}
              onReplyChange={setReplyText}
              onReplySubmit={submitReply}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── CommentCard ──────────────────────────────────────────────────── */
function CommentCard({
  comment, slug, userId,
  replyingTo, replyText, replyRef, replySubmitting,
  onOpenReply, onCloseReply, onReplyChange, onReplySubmit,
}: {
  comment: CommentItem;
  slug: string;
  userId?: string;
  replyingTo: { commentId: string; displayName: string } | null;
  replyText: string;
  replyRef: React.RefObject<HTMLTextAreaElement | null>;
  replySubmitting: boolean;
  onOpenReply: (commentId: string, displayName: string) => void;
  onCloseReply: () => void;
  onReplyChange: (v: string) => void;
  onReplySubmit: () => void;
}) {
  const isReplying = replyingTo?.commentId === comment._id;
  const [showReplies, setShowReplies] = useState(true);
  const [likeCount, setLikeCount] = useState(comment.commentLikes?.length ?? 0);
  const [liked, setLiked] = useState(() =>
    userId ? (comment.commentLikes ?? []).includes(userId) : false,
  );
  const [liking, setLiking] = useState(false);

  // Re-seed when auth resolves (userId arrives after mount) or comments reload,
  // so a comment the user already liked shows as liked even on a fresh load.
  useEffect(() => {
    setLiked(userId ? (comment.commentLikes ?? []).includes(userId) : false);
    setLikeCount(comment.commentLikes?.length ?? 0);
  }, [userId, comment.commentLikes]);

  const displayName = comment.isAdmin
    ? "Admin"
    : comment.userName ?? comment.userEmail ?? "Unknown";

  const handleLike = async () => {
    if (!userId) { toast.error("Sign in to like comments."); return; }
    if (liking) return;
    setLiking(true);
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => prev ? c - 1 : c + 1);
    try {
      const r = await interactionsApi.toggleCommentLike(slug, comment._id, userId);
      setLiked(r.data.liked);
      setLikeCount(r.data.likeCount);
    } catch {
      setLiked(prev);
      setLikeCount((c) => prev ? c + 1 : c - 1);
    } finally {
      setLiking(false);
    }
  };

  const replyCount = comment.commentReplies?.length ?? 0;

  return (
    <div className="flex gap-3">
      <UserAvatar src={comment.profilePicture} name={displayName} size="sm" />
      <div className="flex-1 min-w-0">
        {/* Author + date */}
        <div className="flex items-baseline gap-2">
          <AuthorName name={displayName} userName={comment.userName} isAdmin={comment.isAdmin} />
          {comment.createdAt && (
            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
          )}
        </div>

        <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>

        {/* Actions row */}
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={liking}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-400",
            )}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart className={cn("size-3.5", liked && "fill-rose-500")} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          <button
            onClick={() => isReplying ? onCloseReply() : onOpenReply(comment._id, displayName)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <CornerDownRight className="size-3" />
            {isReplying ? "Cancel" : "Reply"}
          </button>

          {replyCount > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {showReplies ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              ref={replyRef}
              placeholder={`Replying to @${replyingTo?.displayName}…`}
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              disabled={replySubmitting}
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onReplySubmit();
              }}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={onCloseReply} disabled={replySubmitting}>
                Cancel
              </Button>
              <Button size="sm" variant="outline" onClick={onReplySubmit}
                disabled={replySubmitting || !replyText.trim()}>
                {replySubmitting ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                Reply
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && replyCount > 0 && (
          <div className="mt-4 space-y-3 border-l-2 border-border pl-4">
            {comment.commentReplies.map((reply) => (
              <ReplyCard key={reply._id} reply={reply} slug={slug} commentId={comment._id} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ReplyCard ────────────────────────────────────────────────────── */
function ReplyCard({
  reply, slug, commentId, userId,
}: {
  reply: CommentReply;
  slug: string;
  commentId: string;
  userId?: string;
}) {
  const [likeCount, setLikeCount] = useState(reply.commentLikes?.length ?? 0);
  const [liked, setLiked] = useState(() =>
    userId ? (reply.commentLikes ?? []).includes(userId) : false,
  );
  const [liking, setLiking] = useState(false);

  // Re-seed when auth resolves or comments reload (same race as CommentCard).
  useEffect(() => {
    setLiked(userId ? (reply.commentLikes ?? []).includes(userId) : false);
    setLikeCount(reply.commentLikes?.length ?? 0);
  }, [userId, reply.commentLikes]);

  const displayName = reply.replyCommentUser.userName ?? reply.replyCommentUser.email ?? "Unknown";

  const handleLike = async () => {
    if (!userId) { toast.error("Sign in to like."); return; }
    if (liking) return;
    setLiking(true);
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => prev ? c - 1 : c + 1);
    try {
      const r = await interactionsApi.toggleReplyLike(slug, commentId, reply._id, userId);
      setLiked(r.data.liked);
      setLikeCount(r.data.likeCount);
    } catch {
      setLiked(prev);
      setLikeCount((c) => prev ? c + 1 : c - 1);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="flex gap-2">
      <UserAvatar src={reply.replyCommentUser.profilePicture} name={displayName} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <AuthorName name={displayName} userName={reply.replyCommentUser.userName} isAdmin={false} small />
          {reply.createdAt && (
            <span className="text-[10px] text-muted-foreground">{formatDate(reply.createdAt)}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">{reply.replyCommentContent}</p>
        <button
          onClick={handleLike}
          disabled={liking}
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px] transition-colors",
            liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-400",
          )}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart className={cn("size-3", liked && "fill-rose-500")} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
      </div>
    </div>
  );
}

/* ─── AuthorName ───────────────────────────────────────────────────── */
function AuthorName({
  name, userName, isAdmin, small = false,
}: {
  name: string;
  userName?: string | null;
  isAdmin?: boolean;
  small?: boolean;
}) {
  const cls = small
    ? "text-xs font-semibold"
    : "text-sm font-semibold";

  if (isAdmin) {
    return (
      <span className={cn(cls, "text-primary")}>Admin</span>
    );
  }
  if (userName) {
    return (
      <Link
        href={`/user/${userName}`}
        className={cn(cls, "hover:text-primary transition-colors")}
      >
        @{userName}
      </Link>
    );
  }
  return <span className={cls}>{name}</span>;
}

/* ─── Skeletons ────────────────────────────────────────────────────── */
function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, CornerDownRight, Loader2, Heart } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/html";
import { useAuth } from "@/contexts/auth-context";
import { interactionsApi, type CommentItem } from "@/lib/api/interactions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";

type Props = { slug: string; initialCount: number };

export function CommentsSection({ slug, initialCount }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyingSubmitting, setReplySubmitting] = useState(false);
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
    if (replyingTo && replyRef.current) replyRef.current.focus();
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

  const submitReply = async (commentId: string) => {
    if (!user) { toast.error("Sign in to reply."); return; }
    const text = replyText.trim();
    if (!text) return;
    setReplySubmitting(true);
    try {
      await interactionsApi.postReply(slug, user._id, commentId, text);
      toast.success("Reply posted.");
      setReplyingTo(null);
      setReplyText("");
      loadComments();
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
              replyingTo={replyingTo}
              replyText={replyText}
              replyRef={replyRef}
              replyingSubmitting={replyingSubmitting}
              onToggleReply={(id) => {
                if (replyingTo === id) { setReplyingTo(null); setReplyText(""); }
                else { setReplyingTo(id); setReplyText(""); }
              }}
              onReplyChange={setReplyText}
              onReplySubmit={submitReply}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentAvatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" }) {
  return <UserAvatar src={src} name={name} size={size === "sm" ? "xs" : "sm"} />;
}

function CommentCard({
  comment,
  replyingTo,
  replyText,
  replyRef,
  replyingSubmitting,
  onToggleReply,
  onReplyChange,
  onReplySubmit,
}: {
  comment: CommentItem;
  replyingTo: string | null;
  replyText: string;
  replyRef: React.RefObject<HTMLTextAreaElement | null>;
  replyingSubmitting: boolean;
  onToggleReply: (id: string) => void;
  onReplyChange: (v: string) => void;
  onReplySubmit: (id: string) => void;
}) {
  const isReplying = replyingTo === comment._id;
  const displayName = comment.userName ? `@${comment.userName}` : comment.userEmail;

  return (
    <div className="flex gap-3">
      <CommentAvatar name={displayName} src={comment.profilePicture} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{displayName}</span>
          {comment.createdAt && (
            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>

        {/* Actions row */}
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="size-3" />
            {comment.commentLikes?.length ?? 0}
          </span>
          <button
            onClick={() => onToggleReply(comment._id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <CornerDownRight className="size-3" />
            {isReplying ? "Cancel" : `Reply${comment.commentReplies?.length ? ` (${comment.commentReplies.length})` : ""}`}
          </button>
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              ref={replyRef}
              placeholder="Write a reply…"
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              disabled={replyingSubmitting}
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onReplySubmit(comment._id);
              }}
            />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onReplySubmit(comment._id)}
                disabled={replyingSubmitting || !replyText.trim()}>
                {replyingSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                Reply
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.commentReplies?.length > 0 && (
          <div className="mt-4 space-y-3 border-l-2 border-border pl-4">
            {comment.commentReplies.map((reply) => {
              const replyName = reply.replyCommentUser.userName
                ? `@${reply.replyCommentUser.userName}`
                : reply.replyCommentUser.email;
              return (
                <div key={reply._id} className="flex gap-2">
                  <CommentAvatar name={replyName} src={reply.replyCommentUser.profilePicture} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">{replyName}</span>
                      {reply.createdAt && (
                        <span className="text-[10px] text-muted-foreground">{formatDate(reply.createdAt)}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">{reply.replyCommentContent}</p>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Heart className="size-2.5" />
                      {reply.commentLikes?.length ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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

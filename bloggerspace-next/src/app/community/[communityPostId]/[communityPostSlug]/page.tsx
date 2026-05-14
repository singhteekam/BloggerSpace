"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { MessageSquare, Clock, Send, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { communityApi, type CommunityPost, type CommunityReply } from "@/lib/api/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/html";

export default function CommunityPostPage() {
  const { communityPostId, communityPostSlug } = useParams<{
    communityPostId: string;
    communityPostSlug: string;
  }>();
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchPost = async () => {
    try {
      const res = await communityApi.getPost(communityPostSlug);
      setPost(res.data);
    } catch {
      toast.error("Failed to load post.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityPostSlug]);

  const handleReply = async () => {
    if (!user) {
      toast.error("Sign in to reply.");
      return;
    }
    const text = replyText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await communityApi.addReply(communityPostId, user._id, {
        communityPostContent: text,
      });
      toast.success("Reply posted!");
      setReplyText("");
      await fetchPost();
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to post reply.")
          : "Error.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/community">Back to Community</Link>
        </Button>
      </main>
    );
  }

  const authorName =
    post.communityPostAuthor?.fullName ??
    post.communityPostAuthor?.userName ??
    "Anonymous";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/community"
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Community
      </Link>

      {/* Post header */}
      {post.communityPostCategory && (
        <div className="mb-3">
          <Badge variant="secondary">{post.communityPostCategory}</Badge>
        </div>
      )}
      <h1 className="mb-4 font-serif text-2xl font-semibold leading-snug tracking-tight">
        {post.communityPostTopic}
      </h1>
      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          By{" "}
          <Link
            href={`/user/${post.communityPostAuthor?.userName}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {authorName}
          </Link>
        </span>
        {(post.lastUpdatedAt || post.createdAt) && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDate(post.lastUpdatedAt || post.createdAt!)}
          </span>
        )}
      </div>

      {/* Post content */}
      <article
        className="prose prose-sm max-w-none dark:prose-invert mb-10"
        dangerouslySetInnerHTML={{ __html: post.communityPostContent }}
      />

      <Separator className="mb-10" />

      {/* Replies list */}
      <section className="mb-10">
        <h2 className="mb-6 flex items-center gap-2 font-serif text-lg font-semibold">
          <MessageSquare className="size-4 text-muted-foreground" />
          Replies
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({post.communityPostComments?.length ?? 0})
          </span>
        </h2>

        {!post.communityPostComments?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No replies yet. Be the first to respond!
          </p>
        ) : (
          <div className="space-y-6">
            {post.communityPostComments.map((reply) => (
              <ReplyCard key={reply._id} reply={reply} />
            ))}
          </div>
        )}
      </section>

      {/* Reply form */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Add your reply</h3>
        <Textarea
          ref={replyRef}
          placeholder={user ? "Write your reply…" : "Sign in to reply."}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          disabled={!user || submitting}
          rows={4}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
          }}
        />
        {!user && (
          <p className="text-xs text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to post a reply.
          </p>
        )}
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleReply}
            disabled={!user || submitting || !replyText.trim()}
          >
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Post reply
          </Button>
        </div>
      </div>
    </main>
  );
}

function ReplyCard({ reply }: { reply: CommunityReply }) {
  const authorName =
    reply.replyCommunityPostAuthor?.fullName ??
    reply.replyCommunityPostAuthor?.userName ??
    "Anonymous";
  const initials = authorName.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/user/${reply.replyCommunityPostAuthor?.userName}`}
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            @{reply.replyCommunityPostAuthor?.userName ?? "user"}
          </Link>
          {reply.createdAt && (
            <span className="text-xs text-muted-foreground">
              {formatDate(reply.createdAt)}
            </span>
          )}
        </div>
        <div
          className="mt-1 prose prose-sm max-w-none dark:prose-invert text-foreground/90"
          dangerouslySetInnerHTML={{ __html: reply.replyCommunityPostContent }}
        />
      </div>
    </div>
  );
}

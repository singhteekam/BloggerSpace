"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  MessageSquare, Loader2, Trash2, Search, X,
  ChevronDown, ChevronUp, User, Heart, MessageCircle, ExternalLink,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect, useRef } from "react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useDebounce } from "@/hooks/use-debounce";
import { adminApi, type CommunityPost, type PostComment } from "@/lib/api/admin";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/html";

export default function AdminCommunityPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <CommunityManagement adminId={user._id} />;
}

function CommunityManagement({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["admin-community", adminId, debouncedSearch],
    queryFn: ({ pageParam }) =>
      adminApi.getCommunityPosts(adminId, pageParam, debouncedSearch).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => adminApi.deleteCommunityPost(postId, adminId),
    onSuccess: () => {
      toast.success("Post deleted.");
      qc.invalidateQueries({ queryKey: ["admin-community", adminId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      adminApi.deleteComment(postId, commentId, adminId),
    onSuccess: (_data, { postId }) => {
      toast.success("Comment deleted.");
      qc.invalidateQueries({ queryKey: ["admin-post-comments", postId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error."),
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold">Community Posts</h1>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              {debouncedSearch ? `${total} match${total !== 1 ? "es" : ""}` : `${total} total`}
            </span>
          )}
          <RefreshButton onRefresh={() => qc.invalidateQueries({ queryKey: ["admin-community", adminId] })} />
        </div>
      </div>

      <SearchInput search={search} setSearch={setSearch} placeholder="Search by topic or category…" />

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : posts.length === 0 ? (
        <EmptyState query={debouncedSearch} />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              adminId={adminId}
              onDeletePost={() => deleteMutation.mutate(post._id)}
              deletingPost={deleteMutation.isPending}
              onDeleteComment={(commentId) => deleteCommentMutation.mutate({ postId: post._id, commentId })}
              deletingComment={deleteCommentMutation.isPending}
            />
          ))}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function PostCard({
  post, adminId, onDeletePost, deletingPost, onDeleteComment, deletingComment,
}: {
  post: CommunityPost;
  adminId: string;
  onDeletePost: () => void;
  deletingPost: boolean;
  onDeleteComment: (commentId: string) => void;
  deletingComment: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["admin-post-comments", post._id],
    queryFn: () => adminApi.getPostComments(post._id, adminId).then((r) => r.data),
    enabled: expanded,
  });

  const comments = commentsData?.comments ?? [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          {post.communityPostCategory && (
            <Badge variant="secondary" className="mb-1 text-xs">{post.communityPostCategory}</Badge>
          )}
          <p className="font-medium text-foreground line-clamp-2">{post.communityPostTopic}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {post.communityPostAuthor?._id ? (
              <Link
                href={`/admin/manage/team/${post.communityPostAuthor._id}`}
                className="hover:text-primary transition-colors"
              >
                {post.communityPostAuthor.fullName ?? "Anonymous"}
              </Link>
            ) : (
              <span>{post.communityPostAuthor?.fullName ?? "Anonymous"}</span>
            )}
            {" · "}{formatDate(post.createdAt)}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <Link
            href={`/community/${post.communityPostId}/${post.communityPostSlug}`}
            target="_blank"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />Open
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MessageCircle className="size-3.5" />
            Comments
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
          <DeleteConfirmButton
            title={post.communityPostTopic}
            isPending={deletingPost}
            onConfirm={onDeletePost}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30">
          {commentsLoading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <MessageCircle className="size-4" />No comments on this post.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground">{comments.length} comment{comments.length !== 1 ? "s" : ""}</p>
              {comments.map((comment: PostComment) => (
                <CommentRow
                  key={comment._id}
                  comment={comment}
                  onDelete={() => onDeleteComment(comment._id)}
                  deleting={deletingComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment, onDelete, deleting,
}: { comment: PostComment; onDelete: () => void; deleting: boolean }) {
  const plainText = comment.content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const authorName = comment.author
    ? (comment.author.fullName ?? comment.author.userName ?? "Unknown")
    : "Deleted user";

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        <User className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{authorName}</span>
          {comment.author?.userName && (
            <span className="text-xs text-muted-foreground">@{comment.author.userName}</span>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {plainText || <em>Empty comment</em>}
          {comment.content.replace(/<[^>]+>/g, "").length > 200 && "…"}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {comment.likes > 0 && (
            <span className="flex items-center gap-0.5"><Heart className="size-3" />{comment.likes}</span>
          )}
          {comment.repliesCount > 0 && (
            <span className="flex items-center gap-0.5"><MessageCircle className="size-3" />{comment.repliesCount} repl{comment.repliesCount !== 1 ? "ies" : "y"}</span>
          )}
        </div>
      </div>
      <DeleteCommentButton onConfirm={onDelete} isPending={deleting} />
    </div>
  );
}

function DeleteCommentButton({ onConfirm, isPending }: { onConfirm: () => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive transition-colors" disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">Delete comment?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">This will permanently remove the comment. This cannot be undone.</Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={() => { onConfirm(); setOpen(false); }} className="gap-1.5">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchInput({ search, setSearch, placeholder }: { search: string; setSearch: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative mb-5">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
      />
      {search && (
        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MessageSquare className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">
        {query ? `No results for "${query}".` : "No community posts yet."}
      </p>
    </div>
  );
}

function DeleteConfirmButton({ title, isPending, onConfirm }: { title: string; isPending: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">Delete post?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground line-clamp-3">
            &ldquo;{title}&rdquo; — This cannot be undone.
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={() => { onConfirm(); setOpen(false); }} className="gap-1.5">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
    </div>
  );
}

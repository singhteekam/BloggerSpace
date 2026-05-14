"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { MessageSquare, Loader2, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type CommunityPost } from "@/lib/api/admin";
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-community", adminId],
    queryFn: () => adminApi.getCommunityPosts(adminId).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => adminApi.deleteCommunityPost(postId, adminId),
    onSuccess: () => {
      toast.success("Post deleted.");
      qc.invalidateQueries({ queryKey: ["admin-community"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Community Posts</h1>
        {total > 0 && <span className="text-sm text-muted-foreground">{total} total posts</span>}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post}>
              <DeleteConfirmButton
                title={post.communityPostTopic}
                isPending={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate(post._id)}
              />
            </PostCard>
          ))}
        </div>
      )}
    </main>
  );
}

function PostCard({ post, children }: { post: CommunityPost; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        {post.communityPostCategory && (
          <Badge variant="secondary" className="mb-1 text-xs">{post.communityPostCategory}</Badge>
        )}
        <p className="font-medium text-foreground line-clamp-2">{post.communityPostTopic}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {post.communityPostAuthor?.fullName ?? "Anonymous"} · {formatDate(post.createdAt)}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MessageSquare className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">No community posts yet.</p>
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
      <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
    </div>
  );
}

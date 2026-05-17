"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, BookOpen, MessageSquare, Trash2, Gem, BadgeCheck,
  CalendarDays, Mail, Loader2, CheckCheck, Clock,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi } from "@/lib/api/admin";
import { GemsDialog } from "@/components/admin/gems-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";
import * as Dialog from "@radix-ui/react-dialog";
import type { UserContent } from "@/lib/api/admin";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "outline", PENDING_REVIEW: "secondary", UNDER_REVIEW: "secondary",
  AWAITING_AUTHOR: "default", PUBLISHED: "default", ADMIN_PUBLISHED: "default",
  DISCARD_QUEUE: "destructive", ADMIN_DISCARDED: "destructive",
};

const CHUNK = 20;

function useClientInfinite<T>(items: T[]) {
  const [visible, setVisible] = useState(CHUNK);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setVisible(CHUNK); }, [items]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible((v) => v + CHUNK); },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length]);

  return { visibleItems: items.slice(0, visible), hasMore: visible < items.length, sentinelRef };
}

export default function UserContentPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: admin, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!admin) return null;
  return <UserProfile adminId={admin._id} targetUserId={userId} />;
}

function UserProfile({ adminId, targetUserId }: { adminId: string; targetUserId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-content", adminId, targetUserId],
    queryFn: () => adminApi.getUserContent(adminId, targetUserId).then((r) => r.data),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.forceDeleteBlog(adminId, targetUserId, blogId),
    onSuccess: () => {
      toast.success("Blog deleted.");
      qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error."),
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: (postId: string) => adminApi.deleteCommunityPost(postId, adminId),
    onSuccess: () => {
      toast.success("Community post deleted.");
      qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error."),
  });

  if (isLoading) return <PageSkeleton />;
  if (!data) return <div className="p-10 text-center text-muted-foreground">User not found.</div>;

  const { user, blogs, communityPosts } = data;
  const reviewedBlogs = user.reviewedBlogs ?? [];
  const isReviewer = user.role?.toLowerCase().includes("reviewer") || reviewedBlogs.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/admin/manage/team"><ArrowLeft className="size-3.5" />Back to Team</Link>
        </Button>

        {/* User header */}
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {user.fullName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-xl font-semibold">{user.fullName}</h1>
              {user.isVerified && <BadgeCheck className="size-4 text-primary" />}
              <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{user.userName}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="size-3" />{user.email}</span>
              <span className="flex items-center gap-1"><CalendarDays className="size-3" />Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2">
            <Gem className="size-4 text-primary" />
            <span className="font-semibold text-primary">{user.gems ?? 0}</span>
            <span className="text-xs text-muted-foreground">gems</span>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="blogs">
        <TabsList className="mb-5 flex-wrap h-auto gap-1">
          <TabsTrigger value="blogs">
            <BookOpen className="size-3.5 mr-1.5" />Blogs ({blogs.length})
          </TabsTrigger>
          <TabsTrigger value="community">
            <MessageSquare className="size-3.5 mr-1.5" />Community ({communityPosts.length})
          </TabsTrigger>
          {isReviewer && (
            <TabsTrigger value="reviewed">
              <CheckCheck className="size-3.5 mr-1.5" />Reviewed ({reviewedBlogs.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="blogs">
          <BlogsTabContent
            blogs={blogs}
            adminId={adminId}
            authorUser={{ fullName: user.fullName, email: user.email }}
            onDelete={(id) => deleteBlogMutation.mutate(id)}
            deleting={deleteBlogMutation.isPending}
            onGemsAwarded={() => qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] })}
          />
        </TabsContent>

        <TabsContent value="community">
          <CommunityTabContent
            posts={communityPosts}
            onDelete={(id) => deleteCommunityMutation.mutate(id)}
            deleting={deleteCommunityMutation.isPending}
          />
        </TabsContent>

        {isReviewer && (
          <TabsContent value="reviewed">
            <ReviewedTabContent
              entries={reviewedBlogs}
              adminId={adminId}
              onGemsAwarded={() => qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] })}
            />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

type BlogEntry = UserContent["blogs"][number];
type CommunityEntry = UserContent["communityPosts"][number];
type ReviewedEntry = NonNullable<UserContent["user"]["reviewedBlogs"]>[number];

function BlogsTabContent({
  blogs, adminId, authorUser, onDelete, deleting, onGemsAwarded,
}: {
  blogs: BlogEntry[];
  adminId: string;
  authorUser: { fullName: string; email: string };
  onDelete: (id: string) => void;
  deleting: boolean;
  onGemsAwarded: () => void;
}) {
  const { visibleItems, hasMore, sentinelRef } = useClientInfinite(blogs);

  const [gemsOpen, setGemsOpen] = useState(false);
  const [isEditingGems, setIsEditingGems] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogEntry | null>(null);
  const [authorGems, setAuthorGems] = useState("10");
  const [reviewerInputs, setReviewerInputs] = useState<Record<string, string>>({});
  const [gemsLoading, setGemsLoading] = useState(false);

  const openAwardGems = (blog: BlogEntry) => {
    setSelectedBlog(blog);
    setIsEditingGems(false);
    setAuthorGems("10");
    setReviewerInputs({});
    setGemsOpen(true);
  };

  const openEditGems = (blog: BlogEntry) => {
    setSelectedBlog(blog);
    setIsEditingGems(true);
    setAuthorGems(String(blog.gems?.authorGems ?? 0));
    const existing: Record<string, string> = {};
    if (blog.gems?.reviewerAwards?.length) {
      blog.gems.reviewerAwards.forEach((a) => { existing[a.userId] = String(a.gems); });
    } else if (blog.gems?.reviewerUserId && (blog.gems.reviewerGems ?? 0) > 0) {
      existing[blog.gems.reviewerUserId] = String(blog.gems.reviewerGems);
    }
    setReviewerInputs(existing);
    setGemsOpen(true);
  };

  const handleSubmitGems = async () => {
    if (!selectedBlog) return;
    setGemsLoading(true);
    try {
      const reviewerAwards = (selectedBlog.reviewedBy ?? [])
        .map((r) => ({ userId: r.reviewerId, gems: parseInt(reviewerInputs[r.reviewerId] ?? "0") || 0 }))
        .filter((r) => r.gems > 0);
      const payload = { authorGems: parseInt(authorGems) || 0, reviewerAwards };
      if (isEditingGems) {
        await adminApi.updateGems(adminId, selectedBlog._id, payload);
        toast.success("Gems updated!");
      } else {
        await adminApi.awardGems(adminId, selectedBlog._id, payload);
        toast.success("Gems awarded!");
      }
      setGemsOpen(false);
      onGemsAwarded();
    } catch {
      toast.error(isEditingGems ? "Failed to update gems." : "Failed to award gems.");
    } finally {
      setGemsLoading(false);
    }
  };

  if (blogs.length === 0) return <Empty icon={<BookOpen />} msg="No blogs found for this user." />;

  const isPublished = (status: string) => status === "PUBLISHED" || status === "ADMIN_PUBLISHED";

  return (
    <div>
      {selectedBlog && (
        <GemsDialog
          open={gemsOpen}
          setOpen={setGemsOpen}
          title={selectedBlog.title}
          isEditing={isEditingGems}
          authorDetails={authorUser}
          authorGems={authorGems}
          setAuthorGems={setAuthorGems}
          allReviewers={selectedBlog.reviewedBy ?? []}
          reviewerInputs={reviewerInputs}
          setReviewerInputs={setReviewerInputs}
          loading={gemsLoading}
          onSubmit={handleSubmitGems}
        />
      )}
      <div className="divide-y divide-border rounded-xl border">
        {visibleItems.map((blog) => (
          <div key={blog._id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <Link href={`/blogs/${blog.slug}`} target="_blank"
                  className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                  {blog.title}
                </Link>
                <Badge variant={(STATUS_BADGE[blog.status] ?? "outline") as "outline" | "secondary" | "default" | "destructive"} className="text-xs">
                  {blog.status.replace(/_/g, " ")}
                </Badge>
                {blog.gems?.awarded && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                    <Gem className="size-3" />{blog.gems.authorGems} gems
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {blog.category} · {formatDate(blog.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {isPublished(blog.status) && !blog.gems?.awarded && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => openAwardGems(blog)}
                >
                  <Gem className="size-3" />Award Gems
                </Button>
              )}
              {isPublished(blog.status) && blog.gems?.awarded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-7 text-primary hover:text-primary"
                  onClick={() => openEditGems(blog)}
                >
                  <Gem className="size-3" />Edit Gems
                </Button>
              )}
              <ConfirmDelete
                label="Delete blog"
                description={`Permanently delete "${blog.title}"? This action cannot be undone.`}
                onConfirm={() => onDelete(blog._id)}
                loading={deleting}
              />
            </div>
          </div>
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
      <p className="mt-2 text-xs text-muted-foreground text-right">
        Showing {Math.min(visibleItems.length, blogs.length)} of {blogs.length} blog{blogs.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function CommunityTabContent({
  posts, onDelete, deleting,
}: { posts: CommunityEntry[]; onDelete: (id: string) => void; deleting: boolean }) {
  const { visibleItems, hasMore, sentinelRef } = useClientInfinite(posts);
  if (posts.length === 0) return <Empty icon={<MessageSquare />} msg="No community posts found for this user." />;
  return (
    <div>
      <div className="divide-y divide-border rounded-xl border">
        {visibleItems.map((post) => (
          <div key={post._id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/community/${post.communityPostId}/${post.communityPostSlug}`}
                target="_blank"
                className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
              >
                {post.communityPostTopic}
              </Link>
              <p className="text-xs text-muted-foreground">
                {post.communityPostCategory && `${post.communityPostCategory} · `}{formatDate(post.createdAt)}
              </p>
            </div>
            <ConfirmDelete
              label="Delete post"
              description={`Permanently delete "${post.communityPostTopic}"? This cannot be undone.`}
              onConfirm={() => onDelete(post._id)}
              loading={deleting}
            />
          </div>
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
      <p className="mt-2 text-xs text-muted-foreground text-right">
        Showing {Math.min(visibleItems.length, posts.length)} of {posts.length} post{posts.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function ReviewedTabContent({
  entries, adminId, onGemsAwarded,
}: {
  entries: ReviewedEntry[];
  adminId: string;
  onGemsAwarded: () => void;
}) {
  const { visibleItems, hasMore, sentinelRef } = useClientInfinite(entries);

  const [gemsOpen, setGemsOpen] = useState(false);
  const [isEditingGems, setIsEditingGems] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ReviewedEntry | null>(null);
  const [authorGems, setAuthorGems] = useState("10");
  const [reviewerInputs, setReviewerInputs] = useState<Record<string, string>>({});
  const [gemsLoading, setGemsLoading] = useState(false);

  const openAwardGems = (entry: ReviewedEntry) => {
    setSelectedEntry(entry);
    setIsEditingGems(false);
    setAuthorGems("10");
    setReviewerInputs({});
    setGemsOpen(true);
  };

  const openEditGems = (entry: ReviewedEntry) => {
    setSelectedEntry(entry);
    setIsEditingGems(true);
    setAuthorGems(String(entry.blogGems?.authorGems ?? 0));
    const existing: Record<string, string> = {};
    if (entry.blogGems?.reviewerAwards?.length) {
      entry.blogGems.reviewerAwards.forEach((a) => { existing[a.userId] = String(a.gems); });
    } else if (entry.blogGems?.reviewerUserId && (entry.blogGems.reviewerGems ?? 0) > 0) {
      existing[entry.blogGems.reviewerUserId] = String(entry.blogGems.reviewerGems);
    }
    setReviewerInputs(existing);
    setGemsOpen(true);
  };

  const handleSubmitGems = async () => {
    if (!selectedEntry?.blogId) return;
    setGemsLoading(true);
    try {
      const reviewerAwards = (selectedEntry.blogReviewedBy ?? [])
        .map((r) => ({ userId: r.reviewerId, gems: parseInt(reviewerInputs[r.reviewerId] ?? "0") || 0 }))
        .filter((r) => r.gems > 0);
      const payload = { authorGems: parseInt(authorGems) || 0, reviewerAwards };
      if (isEditingGems) {
        await adminApi.updateGems(adminId, selectedEntry.blogId, payload);
        toast.success("Gems updated!");
      } else {
        await adminApi.awardGems(adminId, selectedEntry.blogId, payload);
        toast.success("Gems awarded!");
      }
      setGemsOpen(false);
      onGemsAwarded();
    } catch {
      toast.error(isEditingGems ? "Failed to update gems." : "Failed to award gems.");
    } finally {
      setGemsLoading(false);
    }
  };

  if (entries.length === 0) return <Empty icon={<CheckCheck />} msg="No blogs reviewed yet." />;

  return (
    <div>
      {selectedEntry && (
        <GemsDialog
          open={gemsOpen}
          setOpen={setGemsOpen}
          title={selectedEntry.BlogTitle}
          isEditing={isEditingGems}
          authorDetails={selectedEntry.blogAuthor ?? {}}
          authorGems={authorGems}
          setAuthorGems={setAuthorGems}
          allReviewers={selectedEntry.blogReviewedBy ?? []}
          reviewerInputs={reviewerInputs}
          setReviewerInputs={setReviewerInputs}
          loading={gemsLoading}
          onSubmit={handleSubmitGems}
        />
      )}
      <div className="divide-y divide-border rounded-xl border">
        {visibleItems.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-medium text-sm line-clamp-1">{entry.BlogTitle}</p>
                {(entry.reviewerGems ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                    <Gem className="size-3" />{entry.reviewerGems} gems
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />Reviewed {formatDate(entry.BlogReviewedTime)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {entry.blogId && !entry.gemsAwarded && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => openAwardGems(entry)}
                >
                  <Gem className="size-3" />Award Gems
                </Button>
              )}
              {entry.blogId && entry.gemsAwarded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-7 text-primary hover:text-primary"
                  onClick={() => openEditGems(entry)}
                >
                  <Gem className="size-3" />Edit Gems
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <Link href={`/blogs/${entry.BlogSlug}`} target="_blank">View</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
      <p className="mt-2 text-xs text-muted-foreground text-right">
        Showing {Math.min(visibleItems.length, entries.length)} of {entries.length} review{entries.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function ConfirmDelete({
  label, description, onConfirm, loading,
}: { label: string; description: string; onConfirm: () => void; loading: boolean }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="icon" variant="ghost" className="size-7 shrink-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-semibold">Confirm deletion</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">{description}</Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                {label}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Empty({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">{icon}</div>
      <p className="text-sm">{msg}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </main>
  );
}

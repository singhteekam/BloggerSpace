"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, BookOpen, MessageSquare, Trash2, Gem, BadgeCheck,
  CalendarDays, Mail, Loader2, CheckCheck, Clock, Sparkles, Undo2, History, Star,
  ShieldCheck, ShieldX, RotateCw, Power, AlertCircle,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useAdminConfig } from "@/hooks/use-admin-config";
import { adminApi, type GemsTransaction as GemsTxn } from "@/lib/api/admin";
import { GemsDialog } from "@/components/admin/gems-dialog";
import { GrantGemsDialog } from "@/components/admin/grant-gems-dialog";
import { ReviewerScoreDialog } from "@/components/admin/reviewer-score-dialog";
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

  const [grantOpen, setGrantOpen] = useState(false);

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
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2">
              <Gem className="size-4 text-primary" />
              <span className="font-semibold text-primary">{user.gems ?? 0}</span>
              <span className="text-xs text-muted-foreground">gems</span>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setGrantOpen(true)}>
              <Sparkles className="size-3.5" />Grant gems
            </Button>
          </div>
        </div>
      </div>

      <GrantGemsDialog
        open={grantOpen}
        setOpen={setGrantOpen}
        adminId={adminId}
        targetUserId={targetUserId}
        targetUserName={user.fullName}
        onGranted={() => qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] })}
      />

      <AccountSection
        adminId={adminId}
        targetUserId={targetUserId}
        user={user}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] })}
      />

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
          <TabsTrigger value="grants">
            <Sparkles className="size-3.5 mr-1.5" />Grants
          </TabsTrigger>
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
              targetUserId={targetUserId}
              reviewerName={user.fullName}
              onGemsAwarded={() => qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] })}
            />
          </TabsContent>
        )}

        <TabsContent value="grants">
          <GrantsTabContent adminId={adminId} targetUserId={targetUserId} />
        </TabsContent>
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
  const { data: adminConfig } = useAdminConfig(adminId);
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
          maxAuthorGems={adminConfig?.perBlogAuthorGemsCap}
          maxReviewerGems={adminConfig?.perBlogReviewerGemsCap}
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
  entries, adminId, targetUserId, reviewerName, onGemsAwarded,
}: {
  entries: ReviewedEntry[];
  adminId: string;
  targetUserId: string;
  reviewerName: string;
  onGemsAwarded: () => void;
}) {
  const { data: adminConfig } = useAdminConfig(adminId);
  const { visibleItems, hasMore, sentinelRef } = useClientInfinite(entries);

  const [gemsOpen, setGemsOpen] = useState(false);
  const [isEditingGems, setIsEditingGems] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ReviewedEntry | null>(null);
  const [authorGems, setAuthorGems] = useState("10");
  const [reviewerInputs, setReviewerInputs] = useState<Record<string, string>>({});
  const [gemsLoading, setGemsLoading] = useState(false);

  // Phase 6 — reviewer score dialog state
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoringEntry, setScoringEntry] = useState<ReviewedEntry | null>(null);
  // local optimistic score cache: blogId → score
  const [localScores, setLocalScores] = useState<Record<string, number>>({});

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
          maxAuthorGems={adminConfig?.perBlogAuthorGemsCap}
          maxReviewerGems={adminConfig?.perBlogReviewerGemsCap}
        />
      )}

      {scoringEntry?.blogId && (
        <ReviewerScoreDialog
          open={scoreOpen}
          setOpen={setScoreOpen}
          adminId={adminId}
          blogId={scoringEntry.blogId}
          blogTitle={scoringEntry.BlogTitle}
          reviewerId={targetUserId}
          reviewerName={reviewerName}
          currentScore={
            scoringEntry.blogId != null
              ? (localScores[scoringEntry.blogId] ?? (scoringEntry as ReviewedEntry & { reviewScore?: number | null }).reviewScore ?? null)
              : null
          }
          onSaved={(newScore) => {
            if (scoringEntry.blogId) {
              setLocalScores((prev) => ({ ...prev, [scoringEntry.blogId!]: newScore }));
            }
          }}
        />
      )}

      <div className="divide-y divide-border rounded-xl border">
        {visibleItems.map((entry, i) => {
          const existingScore =
            entry.blogId != null
              ? (localScores[entry.blogId] ?? (entry as ReviewedEntry & { reviewScore?: number | null }).reviewScore ?? null)
              : null;
          return (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm line-clamp-1">{entry.BlogTitle}</p>
                  {(entry.reviewerGems ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                      <Gem className="size-3" />{entry.reviewerGems} gems
                    </span>
                  )}
                  {existingScore != null && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Star className="size-3 fill-current" />{existingScore}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />Reviewed {formatDate(entry.BlogReviewedTime)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {entry.blogId && (
                  <Button
                    variant={existingScore != null ? "ghost" : "outline"}
                    size="sm"
                    className={`gap-1 text-xs h-7 ${existingScore != null ? "text-amber-600 hover:text-amber-700 dark:text-amber-400" : ""}`}
                    onClick={() => { setScoringEntry(entry); setScoreOpen(true); }}
                  >
                    <Star className="size-3" />
                    {existingScore != null ? `Score ${existingScore}` : "Score Review"}
                  </Button>
                )}
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
          );
        })}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
      <p className="mt-2 text-xs text-muted-foreground text-right">
        Showing {Math.min(visibleItems.length, entries.length)} of {entries.length} review{entries.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Grants tab (Phase 3) ─────────────────────────────────────────────────────
// Shows ADMIN_GRANT and ADMIN_GRANT_REVERSE transactions for this user, with a
// Reverse button on any grant that's within the reversal window and not yet reversed.
function GrantsTabContent({ adminId, targetUserId }: { adminId: string; targetUserId: string }) {
  const qc = useQueryClient();
  const { data: cfg } = useAdminConfig(adminId);
  const windowHours = cfg?.grantReverseWindowHours ?? 24;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gem-grants", targetUserId],
    queryFn: () =>
      adminApi
        .getGemsTransactions(adminId, 1, targetUserId, "ADMIN_GRANT,ADMIN_GRANT_REVERSE")
        .then((r) => r.data),
  });

  const reverseMutation = useMutation({
    mutationFn: ({ txnId, reason }: { txnId: string; reason: string }) =>
      adminApi.reverseGrant(adminId, txnId, { reason }),
    onSuccess: () => {
      toast.success("Grant reversed.");
      qc.invalidateQueries({ queryKey: ["admin-gem-grants", targetUserId] });
      qc.invalidateQueries({ queryKey: ["admin-user-content", adminId, targetUserId] });
    },
    onError: (err) =>
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.error ?? "Failed to reverse grant.")
          : "Failed to reverse grant.",
      ),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  const txns = data?.transactions ?? [];
  if (txns.length === 0) {
    return <Empty icon={<History />} msg="No admin grants for this user yet." />;
  }

  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Reversal window: {windowHours}h after the grant was created.
      </p>
      {txns.map((t: GemsTxn) => {
        const isReverse = t.source === "ADMIN_GRANT_REVERSE";
        const ageMs = now - new Date(t.createdAt).getTime();
        const withinWindow = ageMs <= windowMs;
        const canReverse = !isReverse && !t.reversedByTxnId && withinWindow;
        return (
          <div
            key={t._id}
            className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 ${
              isReverse ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={isReverse ? "destructive" : "default"} className="text-[10px]">
                  {isReverse ? "REVERSED" : "GRANT"}
                </Badge>
                <span className={`font-semibold ${isReverse ? "text-destructive" : "text-primary"}`}>
                  {isReverse ? "−" : "+"}{t.amount} gems
                </span>
                {t.reversedByTxnId && !isReverse && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Undo2 className="size-2.5" />Reversed
                  </Badge>
                )}
              </div>
              {t.note && (
                <p className="text-xs text-muted-foreground italic break-words">&ldquo;{t.note}&rdquo;</p>
              )}
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-2.5" />
                {formatDate(t.createdAt)} &middot; by{" "}
                {typeof t.awardedBy === "object" && t.awardedBy
                  ? (t.awardedBy.fullName ?? t.awardedBy.email ?? "admin")
                  : "admin"}
              </p>
            </div>
            {canReverse && (
              <ReverseGrantButton
                onReverse={(reason) => reverseMutation.mutate({ txnId: t._id, reason })}
                loading={reverseMutation.isPending}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReverseGrantButton({
  onReverse,
  loading,
}: {
  onReverse: (reason: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onReverse(reason.trim());
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
          <Undo2 className="size-3" />Reverse
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
          <Dialog.Title className="font-serif text-base font-semibold">Reverse this grant?</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">
            Gems will be deducted back from the user&apos;s balance. This action is logged.
          </Dialog.Description>
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-medium">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Granted wrong user / typo"
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={loading}>Cancel</Button>
            </Dialog.Close>
            <Button size="sm" variant="destructive" disabled={loading} onClick={handleConfirm} className="gap-1.5">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />}
              Reverse
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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

/* ─── Account & verification management (admin-only controls) ─────────── */
type AccountBody = { reverifyNow?: boolean; isVerified?: boolean; status?: "ACTIVE" | "INACTIVE" };

function AccountSection({
  adminId, targetUserId, user, onUpdated,
}: {
  adminId: string;
  targetUserId: string;
  user: UserContent["user"];
  onUpdated: () => void;
}) {
  const [confirm, setConfirm] = useState<
    | null
    | { title: string; desc: string; confirmLabel: string; destructive?: boolean; body: AccountBody }
  >(null);

  const mutation = useMutation({
    mutationFn: (body: AccountBody) => adminApi.updateUserAccount(targetUserId, adminId, body),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setConfirm(null);
      onUpdated();
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error."),
  });

  const isEmailAuth = !user.authType || user.authType === "Email";
  const isActive = (user.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
  const verified = !!user.isVerified;
  const daysAgo = user.lastVerifiedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(user.lastVerifiedAt).getTime()) / 86_400_000))
    : null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
        <ShieldCheck className="size-4 text-primary" />Account &amp; verification
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Account status */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Account status</p>
            <Badge
              variant="outline"
              className={`mt-1 ${isActive
                ? "text-green-700 border-green-300 dark:text-green-400 dark:border-green-700"
                : "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"}`}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <Button
            variant="outline" size="sm" className="shrink-0 gap-1.5"
            onClick={() =>
              setConfirm(
                isActive
                  ? {
                      title: "Deactivate account?",
                      desc: `${user.fullName} won't be able to sign in until reactivated.`,
                      confirmLabel: "Deactivate",
                      destructive: true,
                      body: { status: "INACTIVE" },
                    }
                  : {
                      title: "Activate account?",
                      desc: `${user.fullName} will be able to sign in again.`,
                      confirmLabel: "Activate",
                      body: { status: "ACTIVE" },
                    },
              )
            }
          >
            <Power className="size-3.5" />{isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>

        {/* Email verified */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Email verified</p>
            <Badge
              variant="outline"
              className={`mt-1 ${verified
                ? "text-green-700 border-green-300 dark:text-green-400 dark:border-green-700"
                : "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"}`}
            >
              {verified ? "Verified" : "Not verified"}
            </Badge>
          </div>
          <Button
            variant="outline" size="sm" className="shrink-0 gap-1.5"
            onClick={() =>
              setConfirm(
                verified
                  ? {
                      title: "Mark as unverified?",
                      desc: `Clears the email-verified flag for ${user.fullName}.`,
                      confirmLabel: "Mark unverified",
                      destructive: true,
                      body: { isVerified: false },
                    }
                  : {
                      title: "Mark as verified?",
                      desc: `Sets ${user.fullName} as email-verified without an OTP.`,
                      confirmLabel: "Mark verified",
                      body: { isVerified: true },
                    },
              )
            }
          >
            {verified ? <ShieldX className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
            {verified ? "Unverify" : "Verify"}
          </Button>
        </div>
      </div>

      {/* Periodic re-verification */}
      <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Periodic re-verification</p>
          {!isEmailAuth ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3 text-green-600 dark:text-green-400" />
              Auto-verified via {user.authType} (no manual re-verify needed)
            </p>
          ) : user.lastVerifiedAt ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Last verified {formatDate(user.lastVerifiedAt)}
              {daysAgo !== null && <> ({daysAgo}d ago)</>}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3" />Never re-verified
            </p>
          )}
        </div>
        {isEmailAuth && (
          <Button
            variant="outline" size="sm" className="shrink-0 gap-1.5"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ reverifyNow: true })}
          >
            {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
            Reverify now
          </Button>
        )}
      </div>

      {/* Confirm dialog (status / verified changes) */}
      <Dialog.Root open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Dialog.Title className="font-serif text-lg font-semibold">{confirm?.title}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">{confirm?.desc}</Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
              <Button
                variant={confirm?.destructive ? "destructive" : "default"}
                size="sm" disabled={mutation.isPending}
                onClick={() => confirm && mutation.mutate(confirm.body)}
                className="gap-1.5"
              >
                {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {confirm?.confirmLabel}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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

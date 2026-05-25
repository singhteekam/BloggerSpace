"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  FileText, BookOpen, Globe, AlertCircle, EyeOff, MessageCircleWarning,
  Loader2, CheckCheck, Star, ChevronDown, RefreshCw,
  Pencil, FileMinus, Trash2, Clock, Tag, User,
  ChevronLeft, ChevronRight, Search, X, Gem, Plus, Database,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useAdminConfig } from "@/hooks/use-admin-config";
import { useDebounce } from "@/hooks/use-debounce";
import { adminApi, type AdminBlog, type ReviewerItem } from "@/lib/api/admin";
import { GemsDialog } from "@/components/admin/gems-dialog";
import { BlogScoreDialog } from "@/components/admin/blog-score-dialog";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate, formatDocSize } from "@/lib/utils/html";

export default function AdminBlogsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <BlogManagement adminId={user._id} adminEmail={user.email} />;
}

function BlogManagement({ adminId, adminEmail }: { adminId: string; adminEmail: string }) {
  const qc = useQueryClient();
  const [publishedPage, setPublishedPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 1 whenever the search term changes
  useEffect(() => { setPublishedPage(1); }, [debouncedSearch]);

  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending", adminId],
    queryFn: () => adminApi.getPendingBlogs(adminId).then((r) => r.data),
  });
  const { data: underReview = [], isLoading: underReviewLoading } = useQuery({
    queryKey: ["admin-underreview", adminId],
    queryFn: () => adminApi.getUnderReviewBlogs(adminId).then((r) => r.data),
  });
  const { data: awaitingAuthor = [], isLoading: awaitingLoading } = useQuery({
    queryKey: ["admin-awaiting", adminId],
    queryFn: () => adminApi.getAwaitingAuthorBlogs(adminId).then((r) => r.data),
  });
  const { data: inReview = [], isLoading: inReviewLoading } = useQuery({
    queryKey: ["admin-inreview", adminId],
    queryFn: () => adminApi.getInReviewBlogs(adminId).then((r) => r.data),
  });
  const { data: publishedData, isLoading: publishedLoading } = useQuery({
    queryKey: ["admin-published", adminId, publishedPage, debouncedSearch],
    queryFn: () => adminApi.getPublishedBlogs(adminId, publishedPage, debouncedSearch).then((r) => r.data),
  });
  const { data: discardQueue = [], isLoading: discardLoading } = useQuery({
    queryKey: ["admin-discard", adminId],
    queryFn: () => adminApi.getDiscardQueue(adminId).then((r) => r.data),
  });
  const { data: allReviewers = [] } = useQuery({
    queryKey: ["admin-all-reviewers", adminId],
    queryFn: () => adminApi.getAllReviewers(adminId).then((r) => r.data),
  });

  const published = publishedData?.blogs ?? [];

  // Client-side filtering for non-paginated tabs
  const q = search.toLowerCase().trim();
  const filterBlogs = useMemo(() => (blogs: AdminBlog[]) => {
    if (!q) return blogs;
    return blogs.filter((b) =>
      b.title?.toLowerCase().includes(q) ||
      b.authorDetails?.fullName?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.currentReviewer?.toLowerCase().includes(q),
    );
  }, [q]);

  const fPending      = useMemo(() => filterBlogs(pending),      [filterBlogs, pending]);
  const fUnderReview  = useMemo(() => filterBlogs(underReview),  [filterBlogs, underReview]);
  const fAwaiting     = useMemo(() => filterBlogs(awaitingAuthor),[filterBlogs, awaitingAuthor]);
  const fInReview     = useMemo(() => filterBlogs(inReview),     [filterBlogs, inReview]);
  const fDiscard      = useMemo(() => filterBlogs(discardQueue),  [filterBlogs, discardQueue]);

  const invalidateAll = () => {
    ["admin-pending", "admin-underreview", "admin-awaiting", "admin-inreview", "admin-discard"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, adminId] }),
    );
    qc.invalidateQueries({ queryKey: ["admin-published", adminId] });
  };

  const assignMutation = useMutation({
    mutationFn: ({ blogId, email }: { blogId: string; email: string }) =>
      adminApi.assignReviewer(blogId, adminId, email),
    onSuccess: () => {
      toast.success("Reviewer assigned.");
      invalidateAll();
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const discardMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.discardBlog(blogId, adminId),
    onSuccess: () => { toast.success("Blog discarded."); invalidateAll(); },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const deleteMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.deleteBlogPermanently(blogId, adminId),
    onSuccess: () => {
      toast.success("Blog permanently deleted.");
      invalidateAll();
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const publishedTotal = publishedData?.totalCount ?? published.length;

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-serif text-2xl font-semibold">Blog Management</h1>
        <RefreshButton onRefresh={invalidateAll} />
      </div>

      {/* Global search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by title, author, category…"
        className="mb-5"
      />

      <Tabs defaultValue="pending">
        <div className="overflow-x-auto mb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <TabsList className="flex w-max gap-1">
            <TabsTrigger value="pending">
              <FileText className="size-3.5 mr-1.5" />
              Pending ({pendingLoading ? "…" : fPending.length})
            </TabsTrigger>
            <TabsTrigger value="underreview">
              <EyeOff className="size-3.5 mr-1.5" />
              Under Review ({underReviewLoading ? "…" : fUnderReview.length})
            </TabsTrigger>
            <TabsTrigger value="awaiting">
              <MessageCircleWarning className="size-3.5 mr-1.5" />
              Awaiting Author ({awaitingLoading ? "…" : fAwaiting.length})
            </TabsTrigger>
            <TabsTrigger value="inreview">
              <BookOpen className="size-3.5 mr-1.5" />
              In Review ({inReviewLoading ? "…" : fInReview.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              <Globe className="size-3.5 mr-1.5" />
              Published ({publishedLoading ? "…" : publishedTotal})
            </TabsTrigger>
            <TabsTrigger value="discard">
              <AlertCircle className="size-3.5 mr-1.5" />
              Discard Queue ({discardLoading ? "…" : fDiscard.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Pending Review ───────────────────────────────── */}
        <TabsContent value="pending">
          <SectionHeader title="Pending Review" desc="Blogs submitted by authors — assign a reviewer or review directly." />
          {pendingLoading ? <TabSkeleton /> : fPending.length === 0 ? (
            <EmptyState icon={<FileText />} msg={q ? `No results for "${search}".` : "No blogs awaiting assignment."} />
          ) : (
            <div className="space-y-3">
              {fPending.map((blog) => (
                <BlogCard key={blog._id} blog={blog}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href={`/admin/blogs/edit/${blog._id}`}><Pencil className="size-3.5" />Review</Link>
                    </Button>
                    <AssignPopover reviewers={allReviewers} onAssign={(email) => assignMutation.mutate({ blogId: blog._id, email })} loading={assignMutation.isPending} />
                    <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                  </div>
                </BlogCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Under Review ─────────────────────────────────── */}
        <TabsContent value="underreview">
          <SectionHeader title="Under Review" desc="Blogs currently being reviewed by an assigned reviewer." />
          {underReviewLoading ? <TabSkeleton /> : fUnderReview.length === 0 ? (
            <EmptyState icon={<EyeOff />} msg={q ? `No results for "${search}".` : "No blogs under review."} />
          ) : (
            <div className="space-y-3">
              {fUnderReview.map((blog) => (
                <BlogCard key={blog._id} blog={blog}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href={`/admin/blogs/edit/${blog._id}`}><Pencil className="size-3.5" />Review</Link>
                    </Button>
                    <AssignPopover reviewers={allReviewers} onAssign={(email) => assignMutation.mutate({ blogId: blog._id, email })} loading={assignMutation.isPending} label="Re-assign" />
                    <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                  </div>
                </BlogCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Awaiting Author ──────────────────────────────── */}
        <TabsContent value="awaiting">
          <SectionHeader title="Awaiting Author" desc="Reviewer sent feedback — waiting for the author to respond." />
          {awaitingLoading ? <TabSkeleton /> : fAwaiting.length === 0 ? (
            <EmptyState icon={<MessageCircleWarning />} msg={q ? `No results for "${search}".` : "No blogs awaiting author."} />
          ) : (
            <div className="space-y-3">
              {fAwaiting.map((blog) => (
                <BlogCard key={blog._id} blog={blog}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href={`/admin/blogs/edit/${blog._id}`}><Pencil className="size-3.5" />Review</Link>
                    </Button>
                    <AssignPopover reviewers={allReviewers} onAssign={(email) => assignMutation.mutate({ blogId: blog._id, email })} loading={assignMutation.isPending} label="Re-assign" />
                    <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                  </div>
                </BlogCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── In Review (ready to publish) ─────────────────── */}
        <TabsContent value="inreview">
          <SectionHeader title="In Review" desc="Reviewer has submitted — do a final check and publish." />
          {inReviewLoading ? <TabSkeleton /> : fInReview.length === 0 ? (
            <EmptyState icon={<BookOpen />} msg={q ? `No results for "${search}".` : "No blogs ready for publishing."} />
          ) : (
            <div className="space-y-3">
              {fInReview.map((blog) => (
                <BlogCard key={blog._id} blog={blog}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PublishDialog blog={blog} adminId={adminId} adminEmail={adminEmail} onPublished={invalidateAll} />
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/admin/blogs/edit/${blog._id}`}><Pencil className="size-3.5" />Review</Link>
                    </Button>
                    <AssignPopover reviewers={allReviewers} onAssign={(email) => assignMutation.mutate({ blogId: blog._id, email })} loading={assignMutation.isPending} label="Re-review" />
                    <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                  </div>
                </BlogCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Published ────────────────────────────────────── */}
        <TabsContent value="published">
          <SectionHeader
            title="Published"
            desc={publishedData
              ? `${publishedData.totalCount} published blog${publishedData.totalCount !== 1 ? "s" : ""}${debouncedSearch ? ` matching "${debouncedSearch}"` : ""}.`
              : "All live blogs on BloggerSpace."}
          />
          {publishedLoading ? <TabSkeleton /> : published.length === 0 ? (
            <EmptyState icon={<Globe />} msg={debouncedSearch ? `No results for "${debouncedSearch}".` : "No published blogs yet."} />
          ) : (
            <>
              <div className="space-y-3">
                {published.map((blog) => (
                  <BlogCard key={blog._id} blog={blog}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/blogs/${blog.slug}`} target="_blank">View live</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href={`/admin/blogs/edit/${blog._id}`}><Pencil className="size-3.5" />Edit</Link>
                      </Button>
                      <AwardGemsButton
                        blog={blog}
                        adminId={adminId}
                        onAwarded={() => qc.invalidateQueries({ queryKey: ["admin-published", adminId] })}
                      />
                      <BlogScoreButton
                        blog={blog}
                        adminId={adminId}
                        onSaved={() => qc.invalidateQueries({ queryKey: ["admin-published", adminId] })}
                      />
                      <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                    </div>
                  </BlogCard>
                ))}
              </div>
              {(publishedData?.totalPages ?? 1) > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button variant="outline" size="sm" className="gap-1" disabled={publishedPage <= 1} onClick={() => setPublishedPage((p) => p - 1)}>
                    <ChevronLeft className="size-3.5" />Prev
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {publishedData?.currentPage} of {publishedData?.totalPages}
                  </span>
                  <Button variant="outline" size="sm" className="gap-1" disabled={publishedPage >= (publishedData?.totalPages ?? 1)} onClick={() => setPublishedPage((p) => p + 1)}>
                    Next<ChevronRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Discard Queue ────────────────────────────────── */}
        <TabsContent value="discard">
          <SectionHeader title="Discard Queue" desc="Blogs rejected by reviewers or admin. Delete permanently to remove from DB." />
          {discardLoading ? <TabSkeleton /> : fDiscard.length === 0 ? (
            <EmptyState icon={<AlertCircle />} msg={q ? `No results for "${search}".` : "Discard queue is empty."} />
          ) : (
            <div className="space-y-3">
              {fDiscard.map((blog) => (
                <BlogCard key={blog._id} blog={blog}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/40">Discarded</Badge>
                    <DeletePermanentlyButton title={blog.title} isPending={deleteMutation.isPending} onConfirm={() => deleteMutation.mutate(blog._id)} />
                  </div>
                </BlogCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ─── Search input ────────────────────────────────────────────────── */
function SearchInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── shared sub-components ───────────────────────────────────────── */

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function BlogCard({ blog, children }: { blog: AdminBlog; children: React.ReactNode }) {
  const docSize = formatDocSize(new TextEncoder().encode(JSON.stringify(blog)).length);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-foreground line-clamp-1">{blog.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {blog.authorDetails && (
              <Link
                href={`/admin/manage/team/${blog.authorDetails._id}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <User className="size-3" />{blog.authorDetails.fullName}
              </Link>
            )}
          {blog.category && <span className="flex items-center gap-1"><Tag className="size-3" />{blog.category}</span>}
          <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(blog.lastUpdatedAt || blog.createdAt)}</span>
          {blog.currentReviewer && <span className="text-primary">Reviewer: {blog.currentReviewer}</span>}
          <span className="flex items-center gap-1"><Database className="size-3" />{docSize}</span>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function EmptyState({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}

function TabSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
}

function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    </div>
  );
}

function DeletePermanentlyButton({ title, isPending, onConfirm }: { title: string; isPending: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />Delete
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">Delete permanently?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            &ldquo;{title}&rdquo; will be removed from the database forever. This cannot be undone.
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={() => { onConfirm(); setOpen(false); }} className="gap-1.5">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete forever
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AssignPopover({
  reviewers, onAssign, loading, label = "Assign reviewer",
}: { reviewers: ReviewerItem[]; onAssign: (email: string) => void; loading: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5" disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {label}<ChevronDown className="size-3 ml-0.5" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 w-64 rounded-xl border border-border bg-popover shadow-lg" sideOffset={6} align="end">
          <div className="p-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Select reviewer</p>
            {reviewers.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No active reviewers.</p>
            ) : reviewers.map((r) => (
              <button key={r._id} type="button" onClick={() => { onAssign(r.email); setOpen(false); }}
                className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
                <span className="font-medium">{r.fullName}</span>
                <span className="text-xs text-muted-foreground">{r.email}</span>
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function DiscardButton({ title, isPending, onConfirm }: { title: string; isPending: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
          <FileMinus className="size-3.5" />Discard
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">Discard blog?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Move &ldquo;{title}&rdquo; to the discard queue.
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={() => { onConfirm(); setOpen(false); }} className="gap-1.5">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <FileMinus className="size-3.5" />}Discard
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AwardGemsButton({
  blog, adminId, onAwarded,
}: { blog: AdminBlog; adminId: string; onAwarded: () => void }) {
  const { data: adminConfig } = useAdminConfig(adminId);
  const [open, setOpen] = useState(false);
  const [authorGems, setAuthorGems] = useState("10");
  const [reviewerInputs, setReviewerInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const alreadyAwarded = !!blog.gems?.awarded;

  // Build unified reviewer list: reviewedBy entries + any previous award entries not in reviewedBy
  const reviewedByList = blog.reviewedBy ?? [];
  const prevAwards = alreadyAwarded
    ? (blog.gems!.reviewerAwards?.length
        ? blog.gems!.reviewerAwards
        : blog.gems!.reviewerUserId && blog.gems!.reviewerGems > 0
          ? [{ userId: blog.gems!.reviewerUserId!, gems: blog.gems!.reviewerGems }]
          : [])
    : [];

  const reviewedByIds = new Set(reviewedByList.map((r) => r.reviewerId));
  // Extra entries from previous awards that are no longer in reviewedBy
  const extraAwardEntries = prevAwards
    .filter((a) => !reviewedByIds.has(a.userId))
    .map((a) => ({ reviewerId: a.userId, reviewerName: undefined as string | undefined }));

  const allReviewers = [...reviewedByList, ...extraAwardEntries];

  const openDialog = () => {
    if (alreadyAwarded) {
      // Pre-fill with current awarded values
      setAuthorGems(String(blog.gems!.authorGems));
      const prefilled: Record<string, string> = {};
      for (const a of prevAwards) {
        if (a.userId) prefilled[a.userId] = String(a.gems);
      }
      setReviewerInputs(prefilled);
    } else {
      setAuthorGems("10");
      setReviewerInputs({});
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const reviewerAwards = allReviewers
        .map((r, i) => ({
          userId: r.reviewerId,
          gems: parseInt(reviewerInputs[r.reviewerId ?? String(i)] ?? "0") || 0,
        }))
        .filter((a) => a.userId && a.gems > 0);

      const payload = { authorGems: parseInt(authorGems) || 0, reviewerAwards };

      if (alreadyAwarded) {
        await adminApi.updateGems(adminId, blog._id, payload);
        toast.success("Gems updated.");
      } else {
        await adminApi.awardGems(adminId, blog._id, payload);
        toast.success("Gems awarded!");
      }
      setOpen(false);
      onAwarded();
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed.") : "Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {alreadyAwarded ? (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs">
            <Gem className="size-3 text-primary shrink-0" />
            <span className="font-semibold text-primary">{blog.gems!.authorGems}a</span>
            {prevAwards.map((a, i) => (
              <span key={`${a.userId ?? ""}-${i}`} className="text-muted-foreground">+{a.gems}r</span>
            ))}
          </div>
          <Button
            size="icon" variant="ghost"
            className="size-7 shrink-0 text-muted-foreground hover:text-primary"
            onClick={openDialog} title="Edit gems"
          >
            <Pencil className="size-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm" variant="outline"
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
          onClick={openDialog}
        >
          <Gem className="size-3.5" />Gems
        </Button>
      )}
      <GemsDialog
        open={open} setOpen={setOpen}
        title={blog.title} isEditing={alreadyAwarded}
        authorDetails={blog.authorDetails}
        authorGems={authorGems} setAuthorGems={setAuthorGems}
        allReviewers={allReviewers} reviewerInputs={reviewerInputs} setReviewerInputs={setReviewerInputs}
        loading={loading} onSubmit={handleSubmit}
        maxAuthorGems={adminConfig?.perBlogAuthorGemsCap}
        maxReviewerGems={adminConfig?.perBlogReviewerGemsCap}
      />
    </>
  );
}

// Phase 5 — small button that opens the BlogScoreDialog. Renders the current
// score as a badge when set (so admin can see it at a glance in the blog list).
function BlogScoreButton({
  blog, adminId, onSaved,
}: { blog: AdminBlog; adminId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const currentScore = blog.blogScore ?? 0;

  return (
    <>
      {currentScore > 0 ? (
        <Button
          size="sm" variant="outline"
          className="gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-500/5 dark:text-amber-400"
          onClick={() => setOpen(true)}
          title="Edit blog score"
        >
          <Star className="size-3.5 fill-current" />Score {currentScore}
        </Button>
      ) : (
        <Button
          size="sm" variant="outline"
          className="gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Star className="size-3.5" />Score
        </Button>
      )}
      <BlogScoreDialog
        open={open}
        setOpen={setOpen}
        adminId={adminId}
        blogId={blog._id}
        blogTitle={blog.title}
        currentScore={currentScore}
        onSaved={onSaved}
      />
    </>
  );
}

function PublishDialog({
  blog, adminId, adminEmail, onPublished,
}: { blog: AdminBlog; adminId: string; adminEmail: string; onPublished: () => void }) {
  const { data: adminConfig } = useAdminConfig(adminId);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  // Gems state — shown after successful publish
  const [gemsOpen, setGemsOpen] = useState(false);
  const [gemsAuthorInput, setGemsAuthorInput] = useState("10");
  const [gemsReviewerInputs, setGemsReviewerInputs] = useState<Record<string, string>>({});
  const [gemsLoading, setGemsLoading] = useState(false);

  const reviewers = blog.reviewedBy ?? [];

  const handlePublish = async () => {
    if (rating === 0) { toast.error("Please rate this blog."); return; }
    setLoading(true);
    try {
      const detail = await adminApi.getBlogForReview(blog._id, adminId);
      const b = detail.data;
      await adminApi.publishBlog(blog._id, {
        slug: b.slug, title: b.title, content: b.content,
        category: b.category, tags: b.tags ?? [],
        rating, reviewRemarks: remarks || "Approved by admin.",
        userId: adminId, role: "Admin", email: adminEmail,
      });
      toast.success("Blog published!");
      setOpen(false);
      // Open gems dialog if gems not yet awarded
      if (!blog.gems?.awarded) {
        setGemsAuthorInput("10");
        setGemsReviewerInputs({});
        setGemsOpen(true);
      } else {
        onPublished();
      }
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Publish failed.") : "Error.");
    } finally {
      setLoading(false);
    }
  };

  const handleAwardGems = async () => {
    setGemsLoading(true);
    try {
      const reviewerAwards = reviewers
        .map((r, i) => ({
          userId: r.reviewerId,
          gems: parseInt(gemsReviewerInputs[r.reviewerId ?? String(i)] ?? "0") || 0,
        }))
        .filter((a) => a.userId && a.gems > 0);

      await adminApi.awardGems(adminId, blog._id, {
        authorGems: parseInt(gemsAuthorInput) || 0,
        reviewerAwards,
      });
      toast.success("Gems awarded!");
      setGemsOpen(false);
      onPublished();
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed to award gems.") : "Error.");
    } finally {
      setGemsLoading(false);
    }
  };

  return (
    <>
      <GemsDialog
        open={gemsOpen}
        setOpen={setGemsOpen}
        title={blog.title}
        isEditing={false}
        authorDetails={blog.authorDetails}
        authorGems={gemsAuthorInput}
        setAuthorGems={setGemsAuthorInput}
        allReviewers={reviewers}
        reviewerInputs={gemsReviewerInputs}
        setReviewerInputs={setGemsReviewerInputs}
        loading={gemsLoading}
        onSubmit={handleAwardGems}
        onSkip={() => { setGemsOpen(false); onPublished(); }}
        skipLabel="Skip"
        maxAuthorGems={adminConfig?.perBlogAuthorGemsCap}
        maxReviewerGems={adminConfig?.perBlogReviewerGemsCap}
      />
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button size="sm" className="gap-1.5"><CheckCheck className="size-3.5" />Publish</Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Dialog.Title className="font-serif text-lg font-semibold">Publish blog</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground line-clamp-2">&ldquo;{blog.title}&rdquo;</Dialog.Description>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Final rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
                      <Star className={`size-7 transition-colors ${s <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Remarks (optional)</p>
                <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Final review notes…"
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
              <Button size="sm" disabled={loading} onClick={handlePublish} className="gap-1.5">
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}Publish
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

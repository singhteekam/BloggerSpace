"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  FileText, BookOpen, Globe, AlertCircle, EyeOff, MessageCircleWarning,
  Loader2, CheckCheck, Star, ChevronDown, RefreshCw,
  Pencil, FileMinus, Trash2, Clock, Tag, User,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type AdminBlog, type ReviewerItem } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";

export default function AdminBlogsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <BlogManagement adminId={user._id} adminEmail={user.email} />;
}

function BlogManagement({ adminId, adminEmail }: { adminId: string; adminEmail: string }) {
  const qc = useQueryClient();

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
    queryKey: ["admin-published", adminId],
    queryFn: () => adminApi.getPublishedBlogs(adminId).then((r) => r.data),
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

  const invalidateAll = () => {
    ["admin-pending", "admin-underreview", "admin-awaiting", "admin-inreview", "admin-published", "admin-discard"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, adminId] }),
    );
  };

  const assignMutation = useMutation({
    mutationFn: ({ blogId, email }: { blogId: string; email: string }) =>
      adminApi.assignReviewer(blogId, adminId, email),
    onSuccess: () => {
      toast.success("Reviewer assigned.");
      qc.invalidateQueries({ queryKey: ["admin-pending", adminId] });
      qc.invalidateQueries({ queryKey: ["admin-underreview", adminId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const discardMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.discardBlog(blogId, adminId),
    onSuccess: () => {
      toast.success("Blog discarded.");
      invalidateAll();
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const deleteMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.deleteBlogPermanently(blogId, adminId),
    onSuccess: () => {
      toast.success("Blog permanently deleted.");
      qc.invalidateQueries({ queryKey: ["admin-discard", adminId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold mb-6">Blog Management</h1>

        <Tabs defaultValue="pending">
      <div className="overflow-x-auto mb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <TabsList className="flex w-max gap-1">
            <TabsTrigger value="pending"><FileText className="size-3.5 mr-1.5" />Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="underreview"><EyeOff className="size-3.5 mr-1.5" />Under Review ({underReview.length})</TabsTrigger>
            <TabsTrigger value="awaiting"><MessageCircleWarning className="size-3.5 mr-1.5" />Awaiting Author ({awaitingAuthor.length})</TabsTrigger>
            <TabsTrigger value="inreview"><BookOpen className="size-3.5 mr-1.5" />In Review ({inReview.length})</TabsTrigger>
            <TabsTrigger value="published"><Globe className="size-3.5 mr-1.5" />Published ({published.length})</TabsTrigger>
            <TabsTrigger value="discard"><AlertCircle className="size-3.5 mr-1.5" />Discard Queue ({discardQueue.length})</TabsTrigger>
          </TabsList>
          </div>

          {/* ── Pending Review ───────────────────────────────── */}
          <TabsContent value="pending">
            <SectionHeader title="Pending Review" desc="Blogs submitted by authors — assign a reviewer or review directly." />
            {pendingLoading ? <TabSkeleton /> : pending.length === 0 ? <EmptyState icon={<FileText />} msg="No blogs awaiting assignment." /> : (
              <div className="space-y-3">
                {pending.map((blog) => (
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
            {underReviewLoading ? <TabSkeleton /> : underReview.length === 0 ? <EmptyState icon={<EyeOff />} msg="No blogs under review." /> : (
              <div className="space-y-3">
                {underReview.map((blog) => (
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
            {awaitingLoading ? <TabSkeleton /> : awaitingAuthor.length === 0 ? <EmptyState icon={<MessageCircleWarning />} msg="No blogs awaiting author." /> : (
              <div className="space-y-3">
                {awaitingAuthor.map((blog) => (
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
            {inReviewLoading ? <TabSkeleton /> : inReview.length === 0 ? <EmptyState icon={<BookOpen />} msg="No blogs ready for publishing." /> : (
              <div className="space-y-3">
                {inReview.map((blog) => (
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
            <SectionHeader title="Published" desc="All live blogs on BloggerSpace." />
            {publishedLoading ? <TabSkeleton /> : published.length === 0 ? <EmptyState icon={<Globe />} msg="No published blogs yet." /> : (
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
                      <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                    </div>
                  </BlogCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Discard Queue ────────────────────────────────── */}
          <TabsContent value="discard">
            <SectionHeader title="Discard Queue" desc="Blogs rejected by reviewers or admin. Delete permanently to remove from DB." />
            {discardLoading ? <TabSkeleton /> : discardQueue.length === 0 ? <EmptyState icon={<AlertCircle />} msg="Discard queue is empty." /> : (
              <div className="space-y-3">
                {discardQueue.map((blog) => (
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
      {/* </div> */}
    </main>
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
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-foreground line-clamp-1">{blog.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {blog.authorDetails && <span className="flex items-center gap-1"><User className="size-3" />{blog.authorDetails.fullName}</span>}
          {blog.category && <span className="flex items-center gap-1"><Tag className="size-3" />{blog.category}</span>}
          <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(blog.lastUpdatedAt || blog.createdAt)}</span>
          {blog.currentReviewer && <span className="text-primary">Reviewer: {blog.currentReviewer}</span>}
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

/* ─── Delete permanently button ──────────────────────────────────── */
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

/* ─── Assign reviewer popover ─────────────────────────────────────── */
function AssignPopover({
  reviewers, onAssign, loading, label = "Assign reviewer",
}: {
  reviewers: ReviewerItem[];
  onAssign: (email: string) => void;
  loading: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5" disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {label}
          <ChevronDown className="size-3 ml-0.5" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 w-64 rounded-xl border border-border bg-popover shadow-lg" sideOffset={6} align="end">
          <div className="p-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Select reviewer</p>
            {reviewers.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No active reviewers.</p>
            ) : reviewers.map((r) => (
              <button
                key={r._id}
                type="button"
                onClick={() => { onAssign(r.email); setOpen(false); }}
                className="flex w-full flex-col rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
              >
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

/* ─── Discard confirm button ──────────────────────────────────────── */
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

/* ─── Publish dialog ──────────────────────────────────────────────── */
function PublishDialog({
  blog, adminId, adminEmail, onPublished,
}: {
  blog: AdminBlog; adminId: string; adminEmail: string; onPublished: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

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
      onPublished();
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Publish failed.") : "Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" className="gap-1.5">
          <CheckCheck className="size-3.5" />Publish
        </Button>
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
              <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Final review notes…" className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
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
  );
}

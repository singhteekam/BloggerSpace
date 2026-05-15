"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, Clock, ArrowRight, BookOpen, Tag, User,
  CheckCheck, ListTodo, MessageCircleWarning,
  Search, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useRequireReviewer } from "@/hooks/use-require-reviewer";
import { reviewerApi } from "@/lib/api/reviewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";

const PAGE_SIZE = 10;

export default function ReviewerDashboardPage() {
  const { user, isLoading: authLoading } = useRequireReviewer();

  const { data: assigned = [], isLoading: assignedLoading } = useQuery({
    queryKey: ["reviewer-assigned", user?._id],
    queryFn: () => reviewerApi.getAssignedBlogs(user!._id, user!.email).then((r) => r.data),
    enabled: !!user,
  });

  const { data: awaiting = [], isLoading: awaitingLoading } = useQuery({
    queryKey: ["reviewer-awaiting", user?._id],
    queryFn: () => reviewerApi.getAwaitingAuthorBlogs(user!._id, user!.email).then((r) => r.data),
    enabled: !!user,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["reviewer-profile"],
    queryFn: () => reviewerApi.getProfile().then((r) => r.data),
    enabled: !!user,
  });

  if (authLoading) return <DashboardSkeleton />;
  if (!user) return null;

  const reviewedBlogs = profile?.reviewedBlogs ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Reviewer Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user.fullName} · {user.email}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-2 sm:mt-0 flex-wrap">
          <Badge variant="secondary">{assigned.length} assigned</Badge>
          {awaiting.length > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-400">
              {awaiting.length} awaiting author
            </Badge>
          )}
          <Badge variant="outline">{reviewedBlogs.length} reviewed</Badge>
        </div>
      </div>

      <Tabs defaultValue="assigned">
        <div className="overflow-x-auto mb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <TabsList className="flex w-max gap-1">
            <TabsTrigger value="assigned" className="gap-2">
              <ListTodo className="size-3.5" />
              Assigned ({assigned.length})
            </TabsTrigger>
            <TabsTrigger value="awaiting" className="gap-2">
              <MessageCircleWarning className="size-3.5" />
              Awaiting Author ({awaiting.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CheckCheck className="size-3.5" />
              Review History ({reviewedBlogs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Assigned ── */}
        <TabsContent value="assigned">
          {assignedLoading ? <TabSkeleton /> : (
            <FilteredList
              items={assigned}
              emptyIcon={<BookOpen className="size-6" />}
              emptyTitle="No blogs assigned"
              emptyDesc="Blogs assigned to you by the admin will appear here."
              renderItem={(blog) => (
                <BlogCard
                  key={blog._id}
                  blog={blog}
                  actionLabel="Review"
                  actionHref={`/reviewer/blog/${blog._id}`}
                />
              )}
              filterFn={(b, q) =>
                b.title?.toLowerCase().includes(q) ||
                (b.authorDetails?.fullName ?? b.authorDetails?.userName ?? "").toLowerCase().includes(q) ||
                (b.category ?? "").toLowerCase().includes(q)
              }
            />
          )}
        </TabsContent>

        {/* ── Awaiting Author ── */}
        <TabsContent value="awaiting">
          {awaitingLoading ? <TabSkeleton /> : (
            <FilteredList
              items={awaiting}
              emptyIcon={<MessageCircleWarning className="size-6" />}
              emptyTitle="No blogs awaiting author"
              emptyDesc="Blogs you've sent feedback for will appear here until the author responds."
              renderItem={(blog) => (
                <BlogCard
                  key={blog._id}
                  blog={blog}
                  actionLabel="View"
                  actionHref={`/reviewer/blog/${blog._id}`}
                  statusBadge={
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 shrink-0">
                      Awaiting Author
                    </Badge>
                  }
                />
              )}
              filterFn={(b, q) =>
                b.title?.toLowerCase().includes(q) ||
                (b.authorDetails?.fullName ?? b.authorDetails?.userName ?? "").toLowerCase().includes(q) ||
                (b.category ?? "").toLowerCase().includes(q)
              }
            />
          )}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history">
          {profileLoading ? <TabSkeleton /> : reviewedBlogs.length === 0 ? (
            <EmptyState
              icon={<CheckCheck className="size-6" />}
              title="No reviews yet"
              desc="Blogs you have reviewed will appear here."
            />
          ) : (
            <HistoryList entries={reviewedBlogs} />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ─── FilteredList: search + pagination for any blog list ─────────── */
function FilteredList<T extends { _id: string }>({
  items,
  emptyIcon, emptyTitle, emptyDesc,
  renderItem, filterFn,
}: {
  items: T[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDesc: string;
  renderItem: (item: T) => React.ReactNode;
  filterFn: (item: T, q: string) => boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () => (q ? items.filter((item) => filterFn(item, q)) : items),
    [items, q],
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} />;
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by title, author, category…"
          className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">No results for &ldquo;{search}&rdquo;.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">{paginated.map(renderItem)}</div>
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-3.5" />Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next<ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── History tab with its own search + pagination ────────────────── */
function HistoryList({ entries }: { entries: { BlogTitle: string; BlogSlug: string; BlogReviewedTime: string }[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () => (q ? entries.filter((e) => e.BlogTitle?.toLowerCase().includes(q)) : entries),
    [entries, q],
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search review history…"
          className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length} blog{filtered.length !== 1 ? "s" : ""} reviewed{q ? ` matching "${search}"` : " in total"}
      </p>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No results for &ldquo;{search}&rdquo;.</p>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((entry, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{entry.BlogTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />{formatDate(entry.BlogReviewedTime)}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/blogs/${entry.BlogSlug}`} target="_blank">View</Link>
                </Button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-3.5" />Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next<ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type BlogEntry = {
  _id: string;
  title: string;
  authorDetails?: { fullName?: string; userName?: string };
  category?: string;
  tags?: string[];
  lastUpdatedAt?: string;
  createdAt?: string;
  feedbackToAuthor?: unknown[];
};

function BlogCard({
  blog, actionLabel, actionHref, statusBadge,
}: {
  blog: BlogEntry;
  actionLabel: string;
  actionHref: string;
  statusBadge?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <h2 className="font-medium leading-snug text-foreground line-clamp-2">{blog.title}</h2>
            {statusBadge}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {blog.authorDetails?.fullName ?? blog.authorDetails?.userName ?? "Unknown"}
            </span>
            {blog.category && (
              <span className="flex items-center gap-1">
                <Tag className="size-3" />{blog.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDate(blog.lastUpdatedAt ?? blog.createdAt ?? "")}
            </span>
          </div>
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {blog.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {blog.feedbackToAuthor && blog.feedbackToAuthor.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {blog.feedbackToAuthor.length} previous feedback{blog.feedbackToAuthor.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button asChild size="sm" className="shrink-0 gap-1.5">
          <Link href={actionHref}>
            {actionLabel} <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function TabSkeleton() {
  return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-10 w-64 rounded-full" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Trash2, Loader2, FileText, Search, X, ChevronLeft, ChevronRight, Gem } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { myBlogsApi } from "@/lib/api/user";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/html";
import type { Blog } from "@/types/blog";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT:            { label: "Draft",           variant: "outline" },
  PENDING_REVIEW:   { label: "Pending review",  variant: "secondary" },
  UNDER_REVIEW:     { label: "Under review",    variant: "secondary" },
  AWAITING_AUTHOR:  { label: "Needs revision",  variant: "default" },
  PUBLISHED:        { label: "Published",       variant: "default" },
  ADMIN_PUBLISHED:  { label: "Published",       variant: "default" },
};

const TABS = [
  { value: "published",   label: "Published",      fetcher: myBlogsApi.getPublished },
  { value: "draft",       label: "Drafts",         fetcher: myBlogsApi.getDrafts },
  { value: "pending",     label: "Pending",        fetcher: myBlogsApi.getPending },
  { value: "underreview", label: "Under review",   fetcher: myBlogsApi.getUnderReview },
  { value: "awaiting",    label: "Needs revision", fetcher: myBlogsApi.getAwaitingAuthor },
] as const;

export default function MyBlogsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("published");

  if (authLoading) return <PageSkeleton />;
  if (!user) return null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">My blogs</h1>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => qc.invalidateQueries({ queryKey: ["myblogs"] })} />
          <Button asChild size="sm">
            <Link href="/bloggerspace/newblog">
              <Pencil className="size-3.5" />
              Write new
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <TabsList className="flex w-max gap-1 rounded-full">
            {TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map(({ value, fetcher }) => (
          <TabsContent key={value} value={value}>
            <BlogTab
              userId={user._id}
              userEmail={user.email}
              tabKey={value}
              activeTab={activeTab}
              fetcher={fetcher}
              showEdit={value === "draft" || value === "awaiting"}
              showView={value === "published"}
              showDiscard={value !== "underreview" && value !== "published"}
            />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

function BlogTab({
  userId,
  userEmail,
  tabKey,
  activeTab,
  fetcher,
  showEdit,
  showView,
  showDiscard,
}: {
  userId: string;
  userEmail: string;
  tabKey: string;
  activeTab: string;
  fetcher: (userId: string) => Promise<{ data: Blog[] }>;
  showEdit: boolean;
  showView: boolean;
  showDiscard: boolean;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = search.trim().toLowerCase();

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["myblogs", tabKey, userId],
    queryFn: () => fetcher(userId).then((r) => r.data),
    enabled: activeTab === tabKey,
  });

  const filtered = useMemo(() => {
    if (!q) return blogs;
    return blogs.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        (b.category?.toLowerCase() ?? "").includes(q),
    );
  }, [blogs, q]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const discard = useMutation({
    mutationFn: ({ blogId, slug }: { blogId: string; slug: string }) =>
      myBlogsApi.discard(blogId, userId, { authorEmail: userEmail, slug }),
    onSuccess: () => {
      toast.success("Blog discarded.");
      qc.invalidateQueries({ queryKey: ["myblogs"] });
    },
    onError: (err) => {
      const msg = isAxiosError(err) ? (err.response?.data?.message ?? "Failed to discard.") : "Error.";
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="pt-4">
      {blogs.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by title or category…"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            {q ? `No results for "${search}".` : "No blogs here yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((blog) => {
              const badge = STATUS_BADGE[blog.status] ?? { label: blog.status, variant: "outline" as const };
              return (
                <div
                  key={blog._id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                      {blog.category && (
                        <span className="text-xs text-muted-foreground">{blog.category}</span>
                      )}
                      {blog.gems?.awarded && (blog.gems.authorGems ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                          <Gem className="size-3" />{blog.gems.authorGems} gems
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-foreground line-clamp-1">{blog.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(blog.createdAt || blog.lastUpdatedAt)}
                      {blog.blogViews ? ` · ${blog.blogViews} views` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {showView && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/blogs/${blog.slug}`}>
                          <Eye className="size-3.5" />
                          View
                        </Link>
                      </Button>
                    )}
                    {showEdit && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/bloggerspace/newblog?edit=${blog._id}`}>
                          <Pencil className="size-3.5" />
                          Edit
                        </Link>
                      </Button>
                    )}
                    {showDiscard && (
                      <DiscardConfirmButton
                        title={blog.title}
                        isPending={discard.isPending}
                        onConfirm={() => discard.mutate({ blogId: blog._id, slug: blog.slug })}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <Button
                variant="outline" size="sm" className="gap-1.5"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
                {q && ` (${filtered.length} results)`}
              </span>
              <Button
                variant="outline" size="sm" className="gap-1.5"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next<ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DiscardConfirmButton({
  title, isPending, onConfirm,
}: { title: string; isPending: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">Discard blog?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground line-clamp-3">
            &ldquo;{title}&rdquo; will be discarded. This action is difficult to undo.
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive" size="sm"
              disabled={isPending}
              onClick={() => { onConfirm(); setOpen(false); }}
              className="gap-1.5"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Discard
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Skeleton className="mb-8 h-9 w-36" />
      <Skeleton className="mb-4 h-10 w-96 rounded-full" />
      <Skeleton className="mb-4 h-10 w-full rounded-lg" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );
}

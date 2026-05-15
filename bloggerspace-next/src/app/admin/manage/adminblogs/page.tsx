"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { PenLine, Globe, FileText, Trash2, Loader2, Plus, Clock, Tag, FileMinus, Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, useMemo } from "react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type AdminBlog } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";

export default function AdminBlogsWritePage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <AdminBlogsList adminId={user._id} />;
}

function AdminBlogsList({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const { data: drafts = [], isLoading: draftsLoading } = useQuery({
    queryKey: ["admin-own-drafts", adminId],
    queryFn: () => adminApi.getAdminDraftBlogs(adminId).then((r) => r.data),
  });
  const { data: published = [], isLoading: publishedLoading } = useQuery({
    queryKey: ["admin-own-published", adminId],
    queryFn: () => adminApi.getAdminPublishedBlogs(adminId).then((r) => r.data),
  });
  const { data: discarded = [], isLoading: discardedLoading } = useQuery({
    queryKey: ["admin-own-discarded", adminId],
    queryFn: () => adminApi.getAdminDiscardedBlogs(adminId).then((r) => r.data),
  });

  const filterBlogs = (blogs: AdminBlog[]) =>
    q
      ? blogs.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            (b.category?.toLowerCase() ?? "").includes(q),
        )
      : blogs;

  const fDrafts = useMemo(() => filterBlogs(drafts), [drafts, q]);
  const fPublished = useMemo(() => filterBlogs(published), [published, q]);
  const fDiscarded = useMemo(() => filterBlogs(discarded), [discarded, q]);

  const invalidateAll = () => {
    ["admin-own-drafts", "admin-own-published", "admin-own-discarded"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, adminId] }),
    );
  };

  const discardMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.discardAdminBlog(blogId, adminId),
    onSuccess: () => { toast.success("Blog discarded."); invalidateAll(); },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const deleteMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.deleteBlogPermanently(blogId, adminId),
    onSuccess: () => {
      toast.success("Blog permanently deleted.");
      qc.invalidateQueries({ queryKey: ["admin-own-discarded", adminId] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold">Admin Blogs</h1>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/admin/adminblogs/write"><Plus className="size-3.5" />Write New Blog</Link>
        </Button>
      </div>

      <SearchInput search={search} setSearch={setSearch} placeholder="Search by title or category…" />

      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <Tabs defaultValue="drafts">
          <TabsList className="flex w-max gap-1 mb-6">
            <TabsTrigger value="drafts">
              <FileText className="size-3.5 mr-1.5" />Drafts ({fDrafts.length}{q && drafts.length !== fDrafts.length ? `/${drafts.length}` : ""})
            </TabsTrigger>
            <TabsTrigger value="published">
              <Globe className="size-3.5 mr-1.5" />Published ({fPublished.length}{q && published.length !== fPublished.length ? `/${published.length}` : ""})
            </TabsTrigger>
            <TabsTrigger value="discarded">
              <Trash2 className="size-3.5 mr-1.5" />Discarded ({fDiscarded.length}{q && discarded.length !== fDiscarded.length ? `/${discarded.length}` : ""})
            </TabsTrigger>
          </TabsList>

          {/* Drafts */}
          <TabsContent value="drafts">
            <SectionHeader title="Drafts" desc="Admin-written blogs saved as draft — not yet published." />
            {draftsLoading ? <TabSkeleton /> : fDrafts.length === 0 ? (
              <EmptyState icon={<FileText />} msg={q ? `No results for "${search}".` : "No drafts yet."} />
            ) : (
              <div className="space-y-3">
                {fDrafts.map((blog) => (
                  <BlogCard key={blog._id} blog={blog}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button asChild size="sm" className="gap-1.5">
                        <Link href={`/admin/adminblogs/edit/${blog._id}`}><PenLine className="size-3.5" />Edit &amp; Publish</Link>
                      </Button>
                      <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                    </div>
                  </BlogCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Published */}
          <TabsContent value="published">
            <SectionHeader title="Published" desc="Admin-written blogs live on the site." />
            {publishedLoading ? <TabSkeleton /> : fPublished.length === 0 ? (
              <EmptyState icon={<Globe />} msg={q ? `No results for "${search}".` : "No published admin blogs."} />
            ) : (
              <div className="space-y-3">
                {fPublished.map((blog) => (
                  <BlogCard key={blog._id} blog={blog}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/blogs/${blog.slug}`} target="_blank">View live</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href={`/admin/adminblogs/edit/${blog._id}`}><PenLine className="size-3.5" />Edit</Link>
                      </Button>
                      <DiscardButton title={blog.title} isPending={discardMutation.isPending} onConfirm={() => discardMutation.mutate(blog._id)} />
                    </div>
                  </BlogCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discarded */}
          <TabsContent value="discarded">
            <SectionHeader title="Discarded" desc="Admin blogs removed from publication. Delete permanently to remove from DB." />
            {discardedLoading ? <TabSkeleton /> : fDiscarded.length === 0 ? (
              <EmptyState icon={<Trash2 />} msg={q ? `No results for "${search}".` : "No discarded blogs."} />
            ) : (
              <div className="space-y-3">
                {fDiscarded.map((blog) => (
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
      </div>
    </main>
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
          {blog.category && <span className="flex items-center gap-1"><Tag className="size-3" />{blog.category}</span>}
          <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(blog.lastUpdatedAt || blog.createdAt)}</span>
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
  return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
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
            Move &ldquo;{title}&rdquo; to the discard list. This can&apos;t be undone easily.
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

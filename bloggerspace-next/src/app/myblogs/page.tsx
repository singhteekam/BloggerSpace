"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Trash2, Loader2, FileText } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { myBlogsApi } from "@/lib/api/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/html";
import type { Blog } from "@/types/blog";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT:            { label: "Draft",           variant: "outline" },
  PENDING_REVIEW:   { label: "Pending review",  variant: "secondary" },
  UNDER_REVIEW:     { label: "Under review",    variant: "secondary" },
  AWAITING_AUTHOR:  { label: "Needs revision",  variant: "default" },
  PUBLISHED:        { label: "Published",       variant: "default" },
  ADMIN_PUBLISHED:  { label: "Published",       variant: "default" },
};

const TABS = [
  { value: "published",   label: "Published",     fetcher: myBlogsApi.getPublished },
  { value: "draft",       label: "Drafts",        fetcher: myBlogsApi.getDrafts },
  { value: "pending",     label: "Pending",       fetcher: myBlogsApi.getPending },
  { value: "underreview", label: "Under review",  fetcher: myBlogsApi.getUnderReview },
  { value: "awaiting",    label: "Needs revision",fetcher: myBlogsApi.getAwaitingAuthor },
] as const;

export default function MyBlogsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<string>("published");

  if (authLoading) return <PageSkeleton />;
  if (!user) return null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">My blogs</h1>
        <Button asChild size="sm">
          <Link href="/newblog">
            <Pencil className="size-3.5" />
            Write new
          </Link>
        </Button>
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

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["myblogs", tabKey, userId],
    queryFn: () => fetcher(userId).then((r) => r.data),
    enabled: activeTab === tabKey,
  });

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

  if (!blogs.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileText className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">No blogs here yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {blogs.map((blog) => {
        const badge = STATUS_BADGE[blog.status] ?? { label: blog.status, variant: "outline" as const };
        return (
          <div
            key={blog._id}
            className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant={badge.variant} className="text-xs">
                  {badge.label}
                </Badge>
                {blog.category && (
                  <span className="text-xs text-muted-foreground">{blog.category}</span>
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
                  <Link href={`/newblog?edit=${blog._id}`}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </Button>
              )}
              {showDiscard && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={discard.isPending}
                  onClick={() => discard.mutate({ blogId: blog._id, slug: blog.slug })}
                >
                  {discard.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Skeleton className="mb-8 h-9 w-36" />
      <Skeleton className="mb-4 h-10 w-96 rounded-full" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );
}

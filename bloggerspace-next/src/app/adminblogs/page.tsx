import type { Metadata } from "next";
import { Suspense } from "react";
import { Shield, FileText } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { Pagination } from "@/components/blog/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fetchAdminPublishedBlogs } from "@/lib/api/blogs";

export const metadata: Metadata = {
  title: "Admin Picks | BloggerSpace",
  description: "Handpicked and directly published blogs by the BloggerSpace admin team.",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminBlogsPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));

  const { blogs, pages: totalPages } = await fetchAdminPublishedBlogs(page);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
            <Shield className="size-3.5 text-primary" />
            Admin Picks
          </Badge>
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Admin Published Blogs
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Handpicked and directly published by the BloggerSpace admin team.
        </p>
      </div>

      {blogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          <div className="mt-10">
            <Suspense>
              <Pagination page={page} totalPages={totalPages} />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold">No admin picks yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            No blogs have been admin-published yet. Check back soon!
          </p>
        </div>
      )}
    </main>
  );
}

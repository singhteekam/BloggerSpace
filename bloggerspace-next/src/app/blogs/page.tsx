import type { Metadata } from "next";
import { Suspense } from "react";
import { FileText, Search } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogSearch } from "@/components/blog/blog-search";
import { CategoryTabs } from "@/components/blog/category-tabs";
import { Pagination } from "@/components/blog/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchBlogs,
  fetchBlogsByCategory,
  fetchBlogsByTag,
  searchBlogs,
  fetchDistinctCategories,
  fetchDistinctTags,
} from "@/lib/api/blogs";

export const metadata: Metadata = {
  title: "Browse Blogs",
  description: "Discover reviewed, high-quality articles from the BloggerSpace community.",
};

type Props = {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
};

export default async function BlogsPage({ searchParams }: Props) {
  const { page: pageStr, category, tag, q } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));

  let blogs: import("@/types/blog").Blog[] = [];
  let totalPages = 0;

  const [categoriesResult, tagsResult] = await Promise.allSettled([
    fetchDistinctCategories(),
    fetchDistinctTags(),
  ]);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];

  if (q?.trim()) {
    blogs = await searchBlogs(q.trim());
    totalPages = 1;
  } else if (tag) {
    const data = await fetchBlogsByTag(tag, page);
    blogs = data.blogs;
    totalPages = data.pages;
  } else if (category) {
    const data = await fetchBlogsByCategory(category, page);
    blogs = data.blogs;
    totalPages = data.pages;
  } else {
    const data = await fetchBlogs(page);
    blogs = data.blogs;
    totalPages = data.pages;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Browse blogs
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every post is reviewed by a human before it goes live.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <Suspense fallback={<Skeleton className="h-11 w-full max-w-sm" />}>
          <BlogSearch />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-9 w-full" />}>
          <CategoryTabs categories={categories} tags={tags} />
        </Suspense>
      </div>

      {/* Active filter banner */}
      {q && blogs.length > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{blogs.length}</span>{" "}
            result{blogs.length !== 1 ? "s" : ""} for{" "}
            <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
          </p>
        </div>
      )}

      {(category || tag) && (
        <div className="mb-5">
          <p className="text-sm text-muted-foreground">
            {category ? (
              <>
                Showing blogs in <span className="font-medium text-foreground">{category}</span>
              </>
            ) : (
              <>
                Showing blogs tagged{" "}
                <span className="font-medium text-foreground">#{tag}</span>
              </>
            )}
            {blogs.length > 0 && (
              <> — {blogs.length} post{blogs.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      )}

      {/* Results */}
      {blogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          {!q && (
            <div className="mt-10">
              <Suspense>
                <Pagination page={page} totalPages={totalPages} />
              </Suspense>
            </div>
          )}
        </>
      ) : (
        <EmptyState query={q} category={category} tag={tag} />
      )}
    </main>
  );
}

function EmptyState({
  query,
  category,
  tag,
}: {
  query?: string;
  category?: string;
  tag?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText className="size-6" />
      </div>
      <h2 className="font-serif text-xl font-semibold">No posts found</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {query
          ? `No results for "${query}". Try a different search term.`
          : tag
            ? `No published posts tagged "#${tag}" yet.`
            : category
              ? `No published posts in "${category}" yet.`
              : "No published posts yet. Be the first to write one!"}
      </p>
    </div>
  );
}

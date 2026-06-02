import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { FileText, Search } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogSearch } from "@/components/blog/blog-search";
import { CategoryTabs } from "@/components/blog/category-tabs";
import { Pagination } from "@/components/blog/pagination";
import {
  fetchBlogs,
  fetchFilteredBlogs,
  fetchDistinctCategories,
  fetchDistinctTags,
} from "@/lib/api/blogs";

// Search params make every URL unique — ISR would create a cache entry per
// query/tag/category combination. SSR is cheaper and gives always-fresh results.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Browse Blogs",
  description:
    "Browse reviewed, high-quality blogs on technology, programming, careers, and ideas from the BloggerSpace community by Teekam Singh. Every article is checked by a real reviewer before it's published.",
  path: "/blogs",
  keywords: [
    "browse blogs",
    "read blogs online",
    "tech blogs",
    "programming blogs",
    "developer blogs",
    "career blogs",
    "latest blog posts",
    "trending blogs",
    "reviewed articles",
    "free blogs to read",
  ],
});

type Props = {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
};

export default async function BlogsPage({ searchParams }: Props) {
  const { page: pageStr, category, tag, q } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));

  const selectedCategories = category ? category.split(",").filter(Boolean) : [];
  const selectedTags = tag ? tag.split(",").filter(Boolean) : [];

  const [categoriesResult, tagsResult, blogsResult] = await Promise.allSettled([
    fetchDistinctCategories(),
    fetchDistinctTags(),
    q?.trim() || selectedTags.length || selectedCategories.length
      ? fetchFilteredBlogs({ search: q?.trim(), tag: selectedTags.length ? selectedTags : undefined, category: selectedCategories.length ? selectedCategories : undefined, page })
      : fetchBlogs(page),
  ]);

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];
  const blogsData = blogsResult.status === "fulfilled" ? blogsResult.value : { blogs: [], total: 0, page, pages: 0 };
  const { blogs, total, pages: totalPages } = blogsData;

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
        <BlogSearch
          initialValue={q ?? ""}
          preservedParams={new URLSearchParams({ ...(category && { category }), ...(tag && { tag }) }).toString()}
        />
        <CategoryTabs
          categories={categories}
          tags={tags}
          defaultCategory={category ?? ""}
          defaultTag={tag ?? ""}
          currentSearch={q ?? ""}
        />
      </div>

      {/* Active filter banner */}
      {q && (total > 0 || blogs.length > 0) && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{total}</span>{" "}
            result{total !== 1 ? "s" : ""} for{" "}
            <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
            {totalPages > 1 && (
              <> &mdash; page <span className="font-medium text-foreground">{page}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span></>
            )}
          </p>
        </div>
      )}

      {(selectedCategories.length > 0 || selectedTags.length > 0) && (
        <div className="mb-5">
          <p className="text-sm text-muted-foreground">
            Showing blogs
            {selectedCategories.length > 0 && (
              <> in <span className="font-medium text-foreground">{selectedCategories.join(", ")}</span></>
            )}
            {selectedCategories.length > 0 && selectedTags.length > 0 && " · "}
            {selectedTags.length > 0 && (
              <>tagged <span className="font-medium text-foreground">{selectedTags.map((t) => `#${t}`).join(", ")}</span></>
            )}
            {total > 0 && <> — {total} post{total !== 1 ? "s" : ""}</>}
          </p>
        </div>
      )}

      {/* Results */}
      {blogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={String(blog._id)} blog={blog} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                preservedParams={new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(tag && { tag }) }).toString()}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState query={q} categories={selectedCategories} tags={selectedTags} />
      )}
    </main>
  );
}

function EmptyState({
  query,
  categories,
  tags,
}: {
  query?: string;
  categories: string[];
  tags: string[];
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
          : tags.length
            ? `No published posts tagged ${tags.map((t) => `"#${t}"`).join(", ")} yet.`
            : categories.length
              ? `No published posts in ${categories.map((c) => `"${c}"`).join(", ")} yet.`
              : "No published posts yet. Be the first to write one!"}
      </p>
    </div>
  );
}

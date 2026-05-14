import Link from "next/link";
import { Eye, Heart, TrendingUp, Layers } from "lucide-react";
import type { Blog } from "@/types/blog";

type SidebarBlog = Pick<Blog, "_id" | "slug" | "title" | "blogViews" | "blogLikes" | "category">;

function SidebarItem({ blog, rank }: { blog: SidebarBlog; rank?: number }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
    >
      {rank != null && (
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
          {blog.title}
        </p>
        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {(blog.blogViews ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3" />
            {(blog.blogLikes?.length ?? 0).toLocaleString()}
          </span>
          {blog.category && (
            <span className="truncate">{blog.category}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

type Props = {
  related: Blog[];
  topViewed: Blog[];
  currentSlug: string;
};

export function BlogSidebar({ related, topViewed, currentSlug }: Props) {
  const filteredTop = topViewed.filter((b) => b.slug !== currentSlug).slice(0, 7);
  const filteredRelated = related.filter((b) => b.slug !== currentSlug).slice(0, 5);

  return (
    <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
      {/*
        sticky + max-h + overflow-y-auto:
        The sidebar locks to the top of the viewport and scrolls its own
        content independently — so Trending and Related are always reachable
        no matter how far the reader has scrolled into the main article.
      */}
      <div
        className="sticky top-20 flex flex-col gap-6 overflow-y-auto pb-10"
        style={{ maxHeight: "calc(100vh - 5rem)" }}
      >
        {/* Top Viewed */}
        {filteredTop.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="size-4 text-primary" />
              Trending
            </h3>
            <div className="space-y-0.5">
              {filteredTop.map((blog, i) => (
                <SidebarItem key={blog._id} blog={blog} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {filteredRelated.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="size-4 text-primary" />
              Related posts
            </h3>
            <div className="space-y-0.5">
              {filteredRelated.map((blog) => (
                <SidebarItem key={blog._id} blog={blog} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

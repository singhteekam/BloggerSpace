import Link from "next/link";
import { Eye, MessageSquare, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { htmlToText, formatDate } from "@/lib/utils/html";
import type { Blog } from "@/types/blog";

type BlogCardProps = {
  blog: Blog;
};

export function BlogCard({ blog }: BlogCardProps) {
  const excerpt = htmlToText(blog.content, 140);
  const date = formatDate(blog.createdAt || blog.lastUpdatedAt);
  const authorName = blog.status === "ADMIN_PUBLISHED"
    ? "Admin"
    : (blog.authorDetails?.fullName ?? blog.authorDetails?.userName ?? "Anonymous");

  return (
    <Link href={`/blogs/${blog.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
        {/* Category strip */}
        <div className="border-b border-border px-5 py-3">
          <Badge variant="secondary" className="text-xs">
            {blog.category}
          </Badge>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h2 className="font-serif text-lg font-semibold leading-snug tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h2>

          {excerpt && (
            <p className="text-sm leading-6 text-muted-foreground line-clamp-3">{excerpt}</p>
          )}

          {/* Tags */}
          {blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-foreground">{authorName}</span>
            {date && <span className="text-[11px] text-muted-foreground">{date}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {blog.blogViews ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              {blog.blogLikes?.length ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {blog.comments?.length ?? 0}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

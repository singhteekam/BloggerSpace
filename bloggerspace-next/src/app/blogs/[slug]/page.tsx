import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Eye, Calendar, BadgeCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BackToBlogs } from "@/components/blog/back-to-blogs";
import { BlogActions } from "@/components/blog/blog-actions";
import { CommentsSection } from "@/components/blog/comments-section";
import { BlogViewTracker } from "@/components/blog/blog-view-tracker";
import { LiveViewCount } from "@/components/blog/live-view-count";
import { ShareButtons } from "@/components/blog/share-buttons";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { FollowButton } from "@/components/user/follow-button";
import { LiveFollowerCount } from "@/components/user/live-follower-count";
import { UserAvatar } from "@/components/user/user-avatar";
import { fetchBlogBySlug, fetchRelatedBlogs, fetchTopBlogs, fetchBlogs } from "@/lib/api/blogs";
import { fetchPublicProfile } from "@/lib/api/user";
import { formatDate, htmlToText, readingTime, wrapTables } from "@/lib/utils/html";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/utils/json-ld";
import { siteConfig } from "@/lib/constants/site";

// ISR window for blog pages = 7 days (604800s).
// NOTE: Next 16 requires this route-segment value to be a LITERAL, so it can't be
// imported. Keep it in sync with REVALIDATE.BLOG_DETAIL in lib/constants/revalidate.ts
// (the reference table). Edits/publishes reflect instantly via on-demand
// revalidation; this long window only governs untouched pages → low ISR writes.
export const revalidate = 604800;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const { blogs } = await fetchBlogs(1);
    return blogs.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchBlogBySlug(slug);
  if (!data) return { title: "Post not found" };
  const { blog } = data;
  const description = htmlToText(blog.content, 160);
  const authorName = blog.authorDetails?.fullName ?? blog.authorDetails?.userName ?? "BloggerSpace";
  const canonicalUrl = `${siteConfig.url}/blogs/${slug}`;
  return {
    title: blog.title,
    description,
    alternates: { canonical: canonicalUrl },
    keywords: blog.tags?.length ? blog.tags : [blog.category],
    openGraph: {
      title: blog.title,
      description,
      type: "article",
      url: canonicalUrl,
      publishedTime: blog.createdAt,
      modifiedTime: blog.lastUpdatedAt,
      authors: [authorName],
      tags: blog.tags ?? [],
      siteName: siteConfig.fullName,
      // og:image comes from the dynamic per-blog card in opengraph-image.tsx —
      // do not set a static image here or it overrides that rich 1200×630 card.
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description,
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchBlogBySlug(slug);
  if (!data) notFound();

  const { blog } = data;
  const isAdminBlog = blog.status === "ADMIN_PUBLISHED";
  const authorName = isAdminBlog
    ? "Admin"
    : (blog.authorDetails?.fullName ?? blog.authorDetails?.userName ?? "Anonymous");
  const date = formatDate(blog.createdAt || blog.lastUpdatedAt);
  const shareUrl = `${siteConfig.url}/blogs/${blog.slug}`;

  const authorUserName = isAdminBlog ? undefined : blog.authorDetails?.userName;

  const [related, topViewed, authorProfile] = await Promise.all([
    blog.blogId ? fetchRelatedBlogs(blog.blogId) : Promise.resolve([]),
    fetchTopBlogs(),
    authorUserName ? fetchPublicProfile(authorUserName) : Promise.resolve(null),
  ]);

  const ldArticle = articleJsonLd(blog);
  const ldBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: "Blogs", url: `${siteConfig.url}/blogs` },
    { name: blog.title, url: `${siteConfig.url}/blogs/${blog.slug}` },
  ]);

  return (
    <main>
      <BlogViewTracker slug={blog.slug} blogId={blog.blogId} title={blog.title} category={blog.category} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />

      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex gap-10">

          {/* ── Main column ── */}
          <div className="min-w-0 flex-1">

            {/* Article header */}
            <header className="pb-8">
              <BackToBlogs />

              {blog.category && (
                <Badge variant="secondary" className="mx-3">
                  {blog.category}
                </Badge>
              )}

              <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                {blog.title}
              </h1>

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {authorUserName ? (
                  <Link href={`/user/${authorUserName}`} className="font-medium text-foreground hover:text-primary transition-colors">
                    {authorName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{authorName}</span>
                )}
                {date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {date}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  <LiveViewCount slug={blog.slug} initial={blog.blogViews ?? 0} />
                </span>
                {readingTime(blog.content) && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {readingTime(blog.content)}
                  </span>
                )}
              </div>

              {/* Tags */}
              {blog.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <Separator />

            {/* Article content */}
            <article className="py-10">
              <div
                className="blog-prose"
                dangerouslySetInnerHTML={{ __html: wrapTables(blog.content) }}
              />
            </article>

            {/* Like + Save actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-8">
              <BlogActions
                blogId={blog._id}
                blogSlug={blog.slug}
                blogTitle={blog.title}
                blogCategory={blog.category}
                blogTags={blog.tags ?? []}
                initialLikes={blog.blogLikes ?? []}
              />
              <ShareButtons url={shareUrl} title={blog.title} />
            </div>

            <Separator />

            {/* Author card */}
            <section className="py-8">
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <UserAvatar
                    src={authorProfile?.profilePicture}
                    name={authorName}
                    size="md"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Name — link to public profile */}
                    <div className="flex flex-wrap items-center gap-2">
                      {authorUserName ? (
                        <Link
                          href={`/user/${authorUserName}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {authorName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-foreground">{authorName}</span>
                      )}
                      {authorProfile?.isVerified && (
                        <BadgeCheck className="size-4 text-primary" />
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      BloggerSpace author
                      {authorProfile && (
                        <> · <LiveFollowerCount targetId={authorProfile._id} initialCount={authorProfile.followersCount} /></>
                      )}
                    </p>
                  </div>
                </div>

                {/* Follow button — below the author details; full-width on mobile */}
                {authorProfile && (
                  <FollowButton
                    targetId={authorProfile._id}
                    initialFollowing={authorProfile.isFollowing}
                    className="mt-4 w-full justify-center sm:w-auto"
                  />
                )}
              </div>
            </section>

            {/* Newsletter CTA */}
            <NewsletterCta />

            <Separator />

            {/* Mobile sidebar — shown below author on small screens */}
            {(topViewed.length > 0 || related.length > 0) && (
              <div className="py-8 lg:hidden space-y-6">
                {topViewed.filter((b) => b.slug !== slug).slice(0, 5).length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Trending</h3>
                    <div className="space-y-2">
                      {topViewed.filter((b) => b.slug !== slug).slice(0, 5).map((b, i) => (
                        <a key={b._id} href={`/blogs/${b.slug}`} className="flex gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <span className="shrink-0 font-bold text-primary">{i + 1}.</span>
                          <span className="line-clamp-1">{b.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {related.filter((b) => b.slug !== slug).slice(0, 4).length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Related posts</h3>
                    <div className="space-y-2">
                      {related.filter((b) => b.slug !== slug).slice(0, 4).map((b) => (
                        <a key={b._id} href={`/blogs/${b.slug}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors line-clamp-1">
                          {b.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Comments */}
            <CommentsSection
              slug={blog.slug}
              initialCount={(blog.comments ?? []).reduce(
                (n, c) => n + 1 + (c.commentReplies?.length ?? 0),
                0,
              )}
            />
          </div>

          {/* ── Sidebar ── */}
          <BlogSidebar related={related} topViewed={topViewed} currentSlug={slug} />
        </div>
      </div>
    </main>
  );
}

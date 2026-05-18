import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, BookOpen, Users, Calendar, Eye, Heart, Mail, Star, TrendingUp, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/user/follow-button";
import { UserAvatar } from "@/components/user/user-avatar";
import { fetchPublicProfile } from "@/lib/api/user";
import { formatDate } from "@/lib/utils/html";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchPublicProfile(username);
  if (!profile) return { title: "User not found" };
  return {
    title: `${profile.fullName} (@${profile.userName}) · BloggerSpace`,
    description: `${profile.blogs.length} published blog${profile.blogs.length !== 1 ? "s" : ""} · ${profile.followersCount} followers`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await fetchPublicProfile(username);
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">

      {/* Profile header */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        {/* Avatar */}
        <UserAvatar
          src={profile.profilePicture}
          name={profile.fullName}
          size="xl"
          className="ring-2 ring-border"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              {profile.fullName}
            </h1>
            {profile.isVerified && (
              <BadgeCheck className="size-5 text-primary" />
            )}
          </div>

          {profile.userName && (
            <p className="mt-0.5 text-sm text-muted-foreground">@{profile.userName}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Mail className="size-3" />
              {profile.email}
            </span>
            {profile.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Joined {formatDate(profile.createdAt)}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-sm sm:justify-start">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-muted-foreground" />
              <strong>{profile.blogs.length}</strong>
              <span className="text-muted-foreground">blog{profile.blogs.length !== 1 ? "s" : ""}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              <strong>{profile.followersCount}</strong>
              <span className="text-muted-foreground">followers</span>
            </span>
            <span className="flex items-center gap-1.5">
              <strong>{profile.followingCount}</strong>
              <span className="text-muted-foreground">following</span>
            </span>
          </div>

          {/* Phase 5 — creator score card (only when score > 0) */}
          {(profile.creatorScore ?? 0) > 0 && profile.creatorStats && (
            <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-900/10">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Creator Score</span>
                <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                  {profile.creatorScore}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {profile.creatorStats.scoredBlogCount} scored
                {" · "}avg {profile.creatorStats.avg}
                {" · "}best {profile.creatorStats.best}
              </span>
            </div>
          )}

          {/* Phase 6 — reviewer score card (only when at least one review is scored) */}
          {(profile.reviewerScoreCount ?? 0) > 0 && (
            <div className="mt-3 inline-flex flex-wrap items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-900/40 dark:bg-sky-900/10">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-medium text-sky-700 dark:text-sky-400">Reviewer Score</span>
                <span className="flex items-center gap-0.5 text-base font-bold text-sky-700 dark:text-sky-400">
                  <Star className="size-3.5 fill-current" />
                  {profile.reviewerScoreAvg}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                from {profile.reviewerScoreCount} review{profile.reviewerScoreCount !== 1 ? "s" : ""}
                {" · "}best {profile.reviewerScoreBest}
              </span>
            </div>
          )}
        </div>

        {/* Follow button — client component, handles own auth check */}
        <div className="shrink-0">
          <FollowButton
            targetId={profile._id}
            initialFollowing={profile.isFollowing}
          />
        </div>
      </div>

      <Separator className="my-8" />

      {/* Published blogs */}
      <section>
        <h2 className="mb-5 font-serif text-xl font-semibold tracking-tight">
          Published blogs
        </h2>

        {profile.blogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published blogs yet.</p>
        ) : (
          <div className="space-y-3">
            {profile.blogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blogs/${blog.slug}`}
                className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  {blog.category && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {blog.category}
                    </Badge>
                  )}
                </div>

                {blog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {blog.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" />
                    {(blog.blogViews ?? 0).toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3" />
                    {(blog.blogLikes?.length ?? 0).toLocaleString()} likes
                  </span>
                  {(blog.blogScore ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="size-3 fill-current" />
                      {blog.blogScore}
                    </span>
                  )}
                  {blog.lastUpdatedAt && (
                    <span>{formatDate(blog.lastUpdatedAt)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

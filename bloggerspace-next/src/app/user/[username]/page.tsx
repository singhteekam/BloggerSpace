import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, BookOpen, Users, Calendar, Mail, Star, TrendingUp, MessageSquare, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LinkedInIcon, GitHubIcon } from "@/components/icons/brand";
import { ProfileBlogsList } from "@/components/user/profile-blogs-list";
import { FollowButton } from "@/components/user/follow-button";
import { UserAvatar } from "@/components/user/user-avatar";
import { fetchPublicProfile } from "@/lib/api/user";
import { formatDate } from "@/lib/utils/html";
import { siteConfig } from "@/lib/constants/site";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchPublicProfile(username);
  if (!profile) return { title: "User not found" };

  const title = `${profile.fullName} (@${profile.userName})`;
  const description = profile.bio
    ? profile.bio
    : `${profile.fullName} on BloggerSpace — ${profile.blogs.length} published blog${profile.blogs.length !== 1 ? "s" : ""} · ${profile.followersCount} follower${profile.followersCount !== 1 ? "s" : ""}.`;
  const path = `/user/${profile.userName}`;

  return {
    title,
    description,
    keywords: [profile.fullName, `${profile.fullName} blogs`, `@${profile.userName}`, "BloggerSpace author"],
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · BloggerSpace`,
      description,
      url: path,
      type: "profile",
      siteName: siteConfig.fullName,
    },
    twitter: { card: "summary_large_image", title: `${title} · BloggerSpace`, description },
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

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {profile.bio}
            </p>
          )}

          {/* Social links */}
          {(profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.website) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {profile.socialLinks?.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer nofollow"
                  className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="LinkedIn" title="LinkedIn">
                  <LinkedInIcon className="size-4" />
                </a>
              )}
              {profile.socialLinks?.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer nofollow"
                  className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="GitHub" title="GitHub">
                  <GitHubIcon className="size-4" />
                </a>
              )}
              {profile.socialLinks?.website && (
                <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer nofollow"
                  className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Website" title="Website">
                  <Globe className="size-4" />
                </a>
              )}
            </div>
          )}

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

      {/* Published blogs — first page is server-rendered (SEO); more load on demand */}
      <section>
        <h2 className="mb-5 font-serif text-xl font-semibold tracking-tight">
          Published blogs
          {(profile.blogsTotal ?? profile.blogs.length) > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({(profile.blogsTotal ?? profile.blogs.length).toLocaleString()})
            </span>
          )}
        </h2>

        <ProfileBlogsList
          username={profile.userName}
          initialBlogs={profile.blogs}
          total={profile.blogsTotal ?? profile.blogs.length}
          pageSize={profile.blogsPageSize ?? 12}
        />
      </section>
    </main>
  );
}

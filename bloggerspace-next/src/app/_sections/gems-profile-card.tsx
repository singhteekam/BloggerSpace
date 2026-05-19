"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Gem, TrendingUp, MessageSquare, Star, BadgeCheck,
  Sparkles, ArrowRight, Pencil, ShieldCheck, IndianRupee,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { fetchPublicProfile } from "@/lib/api/user";
import type { AuthUser } from "@/lib/api/auth";
import { UserAvatar } from "@/components/user/user-avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function GemsProfileCard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <CardSkeleton />;
  if (user) return <LoggedInCard user={user} />;
  return <EarningsPotentialCard />;
}

function CardSkeleton() {
  return (
    <Card className="flex h-full flex-col bg-gradient-to-br from-card to-muted/40 p-6">
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="mb-2 h-9 rounded-lg" />
      <Skeleton className="mb-2 h-14 rounded-lg" />
      <Skeleton className="h-14 rounded-lg" />
    </Card>
  );
}

function LoggedInCard({ user }: { user: AuthUser }) {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["public-profile-home", user.userName],
    queryFn: () => fetchPublicProfile(user.userName ?? ""),
    enabled: !!user.userName,
    staleTime: 60_000,
  });

  const creatorScore = profile?.creatorScore ?? 0;
  const reviewerCount = profile?.reviewerScoreCount ?? 0;

  return (
    <Card className="flex h-full flex-col bg-gradient-to-br from-card to-muted/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your profile
        </p>
        {user.userName && (
          <Link
            href={`/user/${user.userName}`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {/* Avatar + name */}
      <div className="mb-4 flex items-center gap-3">
        <UserAvatar src={user.profilePicture} name={user.fullName} size="md" />
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{user.fullName}</span>
            {user.isVerified && <BadgeCheck className="size-3.5 text-primary" />}
          </div>
          {user.userName && (
            <span className="text-xs text-muted-foreground">@{user.userName}</span>
          )}
        </div>
      </div>

      {/* Gem balance */}
      <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2">
        <Gem className="size-4 text-primary" />
        <span className="text-base font-semibold text-primary">{user.gems ?? 0}</span>
        <span className="text-xs text-muted-foreground">gems</span>
        {(user.gems ?? 0) > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            ≈ ₹{(((user.gems ?? 0) * 50) / 100).toFixed(0)}+
          </span>
        )}
      </div>

      {/* Scores — skeleton while loading */}
      {profileLoading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Creator score */}
          {creatorScore > 0 && (
            <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-900/10">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Creator Score</span>
                <span className="ml-auto text-base font-bold text-amber-700 dark:text-amber-400">{creatorScore}</span>
              </div>
              {profile?.creatorStats && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {profile.creatorStats.scoredBlogCount} scored · avg {profile.creatorStats.avg} · best {profile.creatorStats.best}
                </p>
              )}
            </div>
          )}

          {/* Reviewer score */}
          {reviewerCount > 0 && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-900/40 dark:bg-sky-900/10">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="size-3 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-medium text-sky-700 dark:text-sky-400">Reviewer Score</span>
                <span className="ml-auto flex items-center gap-0.5 text-base font-bold text-sky-700 dark:text-sky-400">
                  <Star className="size-3 fill-current" />{profile?.reviewerScoreAvg}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                from {reviewerCount} reviews · best {profile?.reviewerScoreBest}
              </p>
            </div>
          )}

          {/* No scores yet */}
          {creatorScore === 0 && reviewerCount === 0 && (
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground italic">
              Write and get published to build your Creator Score, or apply as a reviewer to earn a Reviewer Score.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function EarningsPotentialCard() {
  return (
    <Card className="flex h-full flex-col bg-gradient-to-br from-card to-emerald-50/30 p-6 dark:to-emerald-950/10">
      {/* Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Sparkles className="size-3" />Earning potential
        </span>
      </div>

      <h3 className="mb-1 font-serif text-lg font-semibold leading-tight">
        Turn writing into real rewards
      </h3>
      <p className="mb-5 text-xs leading-5 text-muted-foreground">
        Active contributors earn gems every time a post publishes or a review goes live. Cash out for gift cards anytime.
      </p>

      {/* Gem earning breakdown */}
      <div className="mb-4 space-y-2">
        {[
          {
            label: "Write & publish",
            desc: "Gems awarded when your blog goes live after editorial review",
            icon: Pencil,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Review blogs",
            desc: "Earn gems each time a blog you reviewed gets published",
            icon: ShieldCheck,
            color: "text-sky-500",
            bg: "bg-sky-500/10",
          },
        ].map(({ label, desc, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-start gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5">
            <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`size-3.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-[11px] leading-4 text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Redemption value callout */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-900/10">
        <IndianRupee className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            100 gems → ₹50
          </p>
          <p className="text-[11px] text-muted-foreground">
            Redeem for Amazon Pay or Flipkart gift cards
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button asChild size="sm" className="mt-auto gap-1.5">
        <Link href="/signup">
          Start earning
          <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </Card>
  );
}

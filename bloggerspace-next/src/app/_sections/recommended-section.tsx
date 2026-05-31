"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { fetchRecommendedBlogs } from "@/lib/api/blogs";
import { BlogCard } from "@/components/blog/blog-card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendedSection() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["recommended-blogs", user?._id ?? "anon"],
    queryFn: () => fetchRecommendedBlogs(user?._id),
    staleTime: 5 * 60 * 1000,
  });

  const blogs = data?.blogs ?? [];
  const personalized = data?.personalized && !!user;

  // Nothing to show (e.g. empty site) — render nothing rather than an empty band.
  if (!isLoading && blogs.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-primary">
            {personalized ? <Sparkles className="size-3.5" /> : <TrendingUp className="size-3.5" />}
            {personalized ? "For you" : "Trending"}
          </p>
          <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            {personalized ? "Recommended reads" : "Trending now"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {personalized
              ? "Picked from the topics and tags you read most."
              : "The most-read posts across BloggerSpace right now."}
          </p>
        </div>
        <Link
          href="/blogs"
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:opacity-80 sm:flex"
        >
          Browse all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={String(blog._id)} blog={blog} />
          ))}
        </div>
      )}
    </section>
  );
}

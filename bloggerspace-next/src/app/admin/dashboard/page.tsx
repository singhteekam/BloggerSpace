"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ShieldCheck, FileText, Users, MessageSquare, Settings,
  ArrowRight, BookOpen, Globe, Clock3,
  MessageCircleWarning, Bot, Loader2, Sparkles, Send, Map, RefreshCw,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi } from "@/lib/api/admin";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <DashboardSkeleton />;
  if (!user) return null;
  return <AdminOverview adminId={user._id} />;
}

function AdminOverview({ adminId }: { adminId: string }) {
  const { data: pending = [] } = useQuery({
    queryKey: ["admin-pending", adminId],
    queryFn: () => adminApi.getPendingBlogs(adminId).then((r) => r.data),
  });
  const { data: inReview = [] } = useQuery({
    queryKey: ["admin-inreview", adminId],
    queryFn: () => adminApi.getInReviewBlogs(adminId).then((r) => r.data),
  });
  const { data: underReview = [] } = useQuery({
    queryKey: ["admin-underreview", adminId],
    queryFn: () => adminApi.getUnderReviewBlogs(adminId).then((r) => r.data),
  });
  const { data: publishedData } = useQuery({
    queryKey: ["admin-published", adminId],
    queryFn: () => adminApi.getPublishedBlogs(adminId).then((r) => r.data),
  });
  const { data: pendingReviewers = [] } = useQuery({
    queryKey: ["admin-pending-reviewers", adminId],
    queryFn: () => adminApi.getPendingReviewers(adminId).then((r) => r.data),
  });
  const { data: awaitingAuthor = [] } = useQuery({
    queryKey: ["admin-awaiting", adminId],
    queryFn: () => adminApi.getAwaitingAuthorBlogs(adminId).then((r) => r.data),
  });

  const publishedCount = publishedData?.totalCount ?? 0;

  const stats = [
    { label: "Pending Review", value: pending.length, color: "text-amber-500" },
    { label: "Under Review", value: underReview.length, color: "text-sky-500" },
    { label: "Awaiting Author", value: awaitingAuthor.length, color: "text-orange-500" },
    { label: "In Review", value: inReview.length, color: "text-blue-500" },
    { label: "Published", value: publishedCount, color: "text-emerald-500" },
    { label: "Pending Reviewers", value: pendingReviewers.length, color: "text-violet-500" },
  ];

  const sections = [
    {
      href: "/admin/manage/blogs",
      icon: <FileText className="size-5" />,
      title: "Blog Management",
      desc: "Review, assign, publish, and moderate all blogs across every stage of the workflow.",
      accent: "bg-blue-500/10 text-blue-500",
      badges: [
        { label: `${pending.length} pending`, show: pending.length > 0 },
        { label: `${inReview.length} in review`, show: inReview.length > 0 },
      ],
    },
    {
      href: "/admin/manage/team",
      icon: <Users className="size-5" />,
      title: "Team Management",
      desc: "Approve reviewer applications, manage active reviewers, and moderate user accounts.",
      accent: "bg-violet-500/10 text-violet-500",
      badges: [
        { label: `${pendingReviewers.length} pending requests`, show: pendingReviewers.length > 0 },
      ],
    },
    {
      href: "/admin/manage/community",
      icon: <MessageSquare className="size-5" />,
      title: "Community",
      desc: "Moderate community discussions, questions, and posts.",
      accent: "bg-emerald-500/10 text-emerald-500",
      badges: [],
    },
    {
      href: "/admin/manage/maintenance",
      icon: <Settings className="size-5" />,
      title: "Maintenance",
      desc: "Run data migrations, download reports, and perform one-time admin operations.",
      accent: "bg-muted text-muted-foreground",
      badges: [],
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview &amp; quick navigation</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick alerts */}
      {(pending.length > 0 || pendingReviewers.length > 0 || awaitingAuthor.length > 0) && (
        <div className="mb-8 space-y-2">
          {pending.length > 0 && (
            <Alert icon={<BookOpen className="size-3.5" />} href="/admin/manage/blogs" color="amber">
              {pending.length} blog{pending.length > 1 ? "s" : ""} waiting for reviewer assignment
            </Alert>
          )}
          {awaitingAuthor.length > 0 && (
            <Alert icon={<MessageCircleWarning className="size-3.5" />} href="/admin/manage/blogs" color="orange">
              {awaitingAuthor.length} blog{awaitingAuthor.length > 1 ? "s" : ""} awaiting author response
            </Alert>
          )}
          {inReview.length > 0 && (
            <Alert icon={<Clock3 className="size-3.5" />} href="/admin/manage/blogs" color="blue">
              {inReview.length} blog{inReview.length > 1 ? "s" : ""} ready for publishing
            </Alert>
          )}
          {pendingReviewers.length > 0 && (
            <Alert icon={<Users className="size-3.5" />} href="/admin/manage/team" color="violet">
              {pendingReviewers.length} reviewer application{pendingReviewers.length > 1 ? "s" : ""} pending approval
            </Alert>
          )}
        </div>
      )}

      {/* Section cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`flex size-10 items-center justify-center rounded-xl ${s.accent}`}>
                {s.icon}
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
            {s.badges.filter((b) => b.show).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {s.badges.filter((b) => b.show).map((b) => (
                  <span
                    key={b.label}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* AI Write card */}
      <AIWriteCard />

      {/* Sitemap card */}
      <SitemapCard />

      {/* Published link */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <Globe className="size-4 text-emerald-500" />
          <span className="text-sm font-medium text-foreground">
            {publishedCount} published blog{publishedCount !== 1 ? "s" : ""} live
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/manage/blogs">View all <ArrowRight className="size-3.5 ml-1" /></Link>
        </Button>
      </div>
    </main>
  );
}

function Alert({
  icon, href, color, children,
}: {
  icon: React.ReactNode;
  href: string;
  color: "amber" | "orange" | "blue" | "violet";
  children: React.ReactNode;
}) {
  const colors = {
    amber: "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-400",
    orange: "bg-orange-500/8 border-orange-500/20 text-orange-700 dark:text-orange-400",
    blue: "bg-blue-500/8 border-blue-500/20 text-blue-700 dark:text-blue-400",
    violet: "bg-violet-500/8 border-violet-500/20 text-violet-700 dark:text-violet-400",
  };
  return (
    <Link href={href} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${colors[color]} hover:opacity-80 transition-opacity`}>
      {icon}
      {children}
      <ArrowRight className="size-3.5 ml-auto shrink-0" />
    </Link>
  );
}

function SitemapCard() {
  const [updating, setUpdating] = useState(false);

  const updateSitemap = async () => {
    setUpdating(true);
    try {
      const res = await api.get("/api/updatesitemap");
      toast.success(res.data?.message ?? "Sitemap updated!");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to update sitemap.") : "Error.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Map className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Sitemap</p>
          <p className="text-sm text-muted-foreground">
            Regenerate <code className="text-xs bg-muted px-1 py-0.5 rounded">sitemap.xml</code> with all published blogs and community posts.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 shrink-0" disabled={updating} onClick={updateSitemap}>
        {updating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        Update Sitemap
      </Button>
    </div>
  );
}

function AIWriteCard() {
  const [writingNext, setWritingNext] = useState(false);
  const [publishingAll, setPublishingAll] = useState(false);

  const writeNext = async () => {
    setWritingNext(true);
    try {
      const res = await api.get("/api/autowrite/nextblog");
      toast.success(res.data?.message ?? "Next AI blog written!");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to write blog.") : "Error.");
    } finally {
      setWritingNext(false);
    }
  };

  const publishAll = async () => {
    setPublishingAll(true);
    try {
      const res = await api.get("/api/autowrite/autopublish");
      toast.success(res.data?.message ?? "All AI blogs published!");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to publish.") : "Error.");
    } finally {
      setPublishingAll(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
          <Bot className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">AI Blog Writer</p>
          <p className="text-sm text-muted-foreground">Generate and publish AI-written blogs automatically.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5" disabled={writingNext} onClick={writeNext}>
          {writingNext ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          Write next AI blog
        </Button>
        <Button size="sm" className="gap-1.5" disabled={publishingAll} onClick={publishAll}>
          {publishingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Publish All
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
    </div>
  );
}

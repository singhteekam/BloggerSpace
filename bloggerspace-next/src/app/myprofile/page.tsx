"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Pencil, Camera, CheckCircle2, BadgeCheck, CalendarDays,
  Gem, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  ShieldCheck, Clock, LayoutDashboard, Globe,
} from "lucide-react";
import { LinkedInIcon, GitHubIcon } from "@/components/icons/brand";
import { UserAvatar } from "@/components/user/user-avatar";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import { userApi, userGemsApi, type UserGemsTransaction } from "@/lib/api/user";
import { RedemptionSection } from "@/components/user/redemption-section";
import { ReadingHistorySection } from "@/components/user/reading-history-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/html";

const urlOrEmpty = z
  .string()
  .trim()
  .max(200, "URL too long")
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Must start with http:// or https://")
  .or(z.literal(""));

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  userName: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(20, "Maximum 20 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
  bio: z.string().max(280, "Bio must be 280 characters or fewer").optional(),
  linkedin: urlOrEmpty,
  github: urlOrEmpty,
  website: urlOrEmpty,
});

type FormValues = z.infer<typeof schema>;

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Skeleton className="mb-8 h-9 w-40" />
      <div className="flex items-center gap-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { login, token } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [gemsPage, setGemsPage] = useState(1);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userinfo"],
    queryFn: () => userApi.getInfo().then((r) => r.data),
    enabled: !!user,
  });

  const { data: gemsHistory, isLoading: gemsLoading } = useQuery({
    queryKey: ["user-gems-history", gemsPage],
    queryFn: () => userGemsApi.getHistory(gemsPage).then((r) => r.data),
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: profile
      ? {
          fullName: profile.fullName,
          userName: profile.userName ?? "",
          bio: profile.bio ?? "",
          linkedin: profile.socialLinks?.linkedin ?? "",
          github: profile.socialLinks?.github ?? "",
          website: profile.socialLinks?.website ?? "",
        }
      : undefined,
  });

  // Sync auth context when API returns fresher role/reviewerStatus (e.g. after admin approves)
  useEffect(() => {
    if (!profile || !user || !token) return;
    if (profile.role !== user.role || profile.reviewerStatus !== user.reviewerStatus) {
      login(token, { ...user, role: profile.role ?? user.role, reviewerStatus: profile.reviewerStatus ?? user.reviewerStatus });
    }
  }, [profile]);

  const picMutation = useMutation({
    mutationFn: (file: File) => userApi.uploadProfilePicture(user!._id, file),
    onSuccess: () => {
      toast.success("Profile picture updated.");
      qc.invalidateQueries({ queryKey: ["userinfo"] });
    },
    onError: () => toast.error("Failed to upload picture. Ensure it is under 5 MB."),
  });

  const onSave = async (data: FormValues) => {
    if (!user) return;
    try {
      const res = await userApi.updateProfile(user._id, {
        fullName: data.fullName,
        userName: data.userName,
        bio: data.bio ?? "",
        socialLinks: {
          linkedin: data.linkedin ?? "",
          github: data.github ?? "",
          website: data.website ?? "",
        },
      });
      login(localStorage.getItem("bs.token")!, res.data.user);
      qc.invalidateQueries({ queryKey: ["userinfo"] });
      toast.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? "Update failed.")
        : "Something went wrong.";
      toast.error(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5 MB.");
      return;
    }
    picMutation.mutate(file);
  };

  if (authLoading || profileLoading) return <ProfileSkeleton />;
  if (!user) return null;

  const isElevatedRole = user.role === "reviewer" || user.role === "Admin";
  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const gems = profile?.gems ?? 0;
  const transactions = gemsHistory?.transactions ?? [];
  const totalGemsPages = gemsHistory?.pages ?? 1;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight">My profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <UserAvatar
            src={profile?.profilePicture}
            name={profile?.fullName ?? "?"}
            size="xl"
            className="ring-2 ring-border"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className={cn(
              "absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:text-foreground",
              picMutation.isPending ? "text-muted-foreground" : "text-muted-foreground hover:bg-muted",
            )}
            aria-label="Change profile picture"
            disabled={picMutation.isPending}
            title="Upload profile picture"
          >
            {picMutation.isPending
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Camera className="size-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold wrap-break-word">{profile?.fullName}</p>
            {profile?.isVerified && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs text-primary">
                <BadgeCheck className="size-3 fill-primary text-primary-foreground" />
                Verified
              </Badge>
            )}
            {isElevatedRole && (
              <Badge variant="outline" className="px-2 py-0.5 text-xs capitalize">
                {user.role}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground wrap-break-word">@{profile?.userName ?? "—"}</p>
          <p className="text-sm text-muted-foreground break-all">{profile?.email ?? user.email}</p>
          {joinedDate && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />
              <span>Joined {joinedDate}</span>
            </p>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Reviewer status CTA */}
      {user.role !== "Admin" && (
        <>
          {(user.reviewerStatus === "none" || user.reviewerStatus === "rejected" || !user.reviewerStatus) && (
            <div className="mb-6 rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Become a reviewer</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Help maintain content quality by reviewing blog submissions before they go live.
                  </p>
                  {user.reviewerStatus === "rejected" && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Your previous application was not approved. You can reapply.
                    </p>
                  )}
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href="/apply-reviewer">Apply now</Link>
                </Button>
              </div>
            </div>
          )}

          {user.reviewerStatus === "pending" && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-5">
              <div className="flex items-center gap-3">
                <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Application under review</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Our admin team will review your application and notify you by email once a decision is made.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.role === "reviewer" && user.reviewerStatus === "approved" && (
            <div className="mb-6 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Reviewer access active</p>
                  <p className="text-xs text-muted-foreground">You can review and approve blog submissions.</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
                  <Link href="/reviewer">
                    <LayoutDashboard className="size-3.5" />Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Gems balance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Gem className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Gems balance</p>
              <p className="truncate text-xs text-muted-foreground">Earned for publishing &amp; reviewing</p>
            </div>
          </div>
          <p className="shrink-0 text-3xl font-bold text-primary">{gems}</p>
        </div>
      </div>

      {/* Redemption (Phase 4) */}
      <div className="mt-4">
        <RedemptionSection gemsBalance={gems} />
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-semibold text-sm">Transaction history</p>
          {!gemsLoading && (gemsHistory?.total ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {gemsHistory!.total} transaction{gemsHistory!.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {gemsLoading ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Gem className="size-6" />
            <p className="text-sm">No transactions yet. Publish blogs to earn gems!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <TransactionRow key={tx._id} tx={tx} />
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={gemsPage <= 1}
                onClick={() => setGemsPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {gemsPage} of {totalGemsPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={gemsPage >= totalGemsPages}
                onClick={() => setGemsPage((p) => p + 1)}
              >
                Next<ChevronRight className="size-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Reading history */}
      <div className="mt-4">
        <ReadingHistorySection enabled={!!user} />
      </div>

      <Separator className="my-8" />

      {/* Edit form */}
      {editing ? (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <h2 className="font-semibold">Edit profile</h2>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="userName">Username</Label>
            <Input id="userName" {...register("userName")} />
            {errors.userName && <p className="text-xs text-destructive">{errors.userName.message}</p>}
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores. 3–20 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} placeholder="Tell readers a little about yourself…" {...register("bio")} />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
            <p className="text-xs text-muted-foreground">Up to 280 characters. Shown on your public profile.</p>
          </div>

          <div className="space-y-3">
            <Label>Social links</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground"><LinkedInIcon className="size-4" /></span>
                <Input placeholder="https://linkedin.com/in/username" {...register("linkedin")} />
              </div>
              {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground"><GitHubIcon className="size-4" /></span>
                <Input placeholder="https://github.com/username" {...register("github")} />
              </div>
              {errors.github && <p className="text-xs text-destructive">{errors.github.message}</p>}
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground"><Globe className="size-4" /></span>
                <Input placeholder="https://yourwebsite.com" {...register("website")} />
              </div>
              {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => { setEditing(false); reset(); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
          Edit profile
        </Button>
      )}
    </main>
  );
}

function TransactionRow({ tx }: { tx: UserGemsTransaction }) {
  const isAward = tx.type === "AWARD";
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full",
        isAward ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      )}>
        {isAward ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium line-clamp-1">{tx.blogTitle}</p>
        <p className="text-xs text-muted-foreground">
          {tx.role === "AUTHOR" ? "As author" : "As reviewer"} · {formatDate(tx.createdAt)}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <span className={cn(
          "text-sm font-semibold",
          isAward ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
        )}>
          {isAward ? "+" : "-"}{tx.amount}
        </span>
        <Gem className="size-3 text-primary" />
      </div>
    </div>
  );
}

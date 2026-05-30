"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  Users, UserCheck, UserX, Loader2, Trash2, Clock, Ban, ShieldCheck, Search, X, Eye, Gem,
  RotateCcw, AlertCircle, LogIn,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, useMemo } from "react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type ReviewerItem, type UserItem } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/html";


export default function AdminTeamPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <TeamManagement adminId={user._id} />;
}

function TeamManagement({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const { data: verifiedReviewers = [], isLoading: verifiedLoading } = useQuery({
    queryKey: ["admin-verified-reviewers", adminId],
    queryFn: () => adminApi.getVerifiedReviewers(adminId).then((r) => r.data),
  });
  const { data: pendingReviewers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-reviewers", adminId],
    queryFn: () => adminApi.getPendingReviewers(adminId).then((r) => r.data),
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", adminId],
    queryFn: () => adminApi.getUsers(adminId).then((r) => r.data),
  });

  const matchReviewer = (r: ReviewerItem) =>
    r.fullName.toLowerCase().includes(q) ||
    r.userName.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q);

  const matchUser = (u: UserItem) =>
    u.fullName.toLowerCase().includes(q) ||
    u.userName.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q);

  const fPending = useMemo(() => (q ? pendingReviewers.filter(matchReviewer) : pendingReviewers), [pendingReviewers, q]);
  const fVerified = useMemo(() => (q ? verifiedReviewers.filter(matchReviewer) : verifiedReviewers), [verifiedReviewers, q]);
  const fUsers = useMemo(() => (q ? users.filter(matchUser) : users), [users, q]);

  const approveMutation = useMutation({
    mutationFn: (reviewerId: string) => adminApi.approveReviewer(reviewerId, adminId),
    onSuccess: () => {
      toast.success("Reviewer approved.");
      qc.invalidateQueries({ queryKey: ["admin-pending-reviewers"] });
      qc.invalidateQueries({ queryKey: ["admin-verified-reviewers"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const rejectMutation = useMutation({
    mutationFn: (reviewerId: string) => adminApi.rejectReviewer(reviewerId, adminId),
    onSuccess: () => {
      toast.success("Request rejected.");
      qc.invalidateQueries({ queryKey: ["admin-pending-reviewers"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const removeMutation = useMutation({
    mutationFn: (reviewerId: string) => adminApi.removeReviewer(reviewerId, adminId),
    onSuccess: () => {
      toast.success("Reviewer removed.");
      qc.invalidateQueries({ queryKey: ["admin-verified-reviewers"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, email }: { userId: string; email: string }) =>
      adminApi.deleteUser(userId, email, adminId),
    onSuccess: () => {
      toast.success("User permanently deleted.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deactivateUser(userId, adminId),
    onSuccess: () => {
      toast.success("Account deactivated.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.reactivateUser(userId, adminId),
    onSuccess: () => {
      toast.success("Account reactivated.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-verified-reviewers", adminId] });
    qc.invalidateQueries({ queryKey: ["admin-pending-reviewers", adminId] });
    qc.invalidateQueries({ queryKey: ["admin-users", adminId] });
  };

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-serif text-2xl font-semibold">Team Management</h1>
        <RefreshButton onRefresh={refreshAll} />
      </div>

      <SearchInput search={search} setSearch={setSearch} placeholder="Search by name, username, or email…" />

        <Tabs defaultValue="pending">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <TabsList className="flex w-max gap-1 mb-6">
              <TabsTrigger value="pending">
                <UserCheck className="size-3.5 mr-1.5" />Pending ({fPending.length}{q && pendingReviewers.length !== fPending.length ? `/${pendingReviewers.length}` : ""})
              </TabsTrigger>
              <TabsTrigger value="reviewers">
                <Users className="size-3.5 mr-1.5" />Active Reviewers ({fVerified.length}{q && verifiedReviewers.length !== fVerified.length ? `/${verifiedReviewers.length}` : ""})
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="size-3.5 mr-1.5" />Users ({fUsers.length}{q && users.length !== fUsers.length ? `/${users.length}` : ""})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Pending Reviewer Requests ─── */}
          <TabsContent value="pending">
            <SectionHeader title="Pending Reviewer Requests" desc="New reviewer sign-up requests awaiting your approval." />
            {pendingLoading ? <TabSkeleton /> : fPending.length === 0 ? (
              <EmptyState icon={<UserCheck />} msg={q ? `No results for "${search}".` : "No pending reviewer requests."} />
            ) : (
              <div className="space-y-3">
                {fPending.map((r) => (
                  <ReviewerCard key={r._id} reviewer={r}>
                    <ConfirmActionButton
                      label="Approve"
                      icon={<UserCheck className="size-3.5" />}
                      dialogTitle="Approve reviewer?"
                      dialogDesc={`Grant reviewer access to ${r.fullName} (${r.email}). They will receive an email and can start reviewing blogs.`}
                      confirmLabel="Approve"
                      isPending={approveMutation.isPending}
                      onConfirm={() => approveMutation.mutate(r._id)}
                      triggerVariant="default"
                      confirmVariant="default"
                    />
                    <ConfirmActionButton
                      label="Reject"
                      icon={<Ban className="size-3.5" />}
                      dialogTitle="Reject request?"
                      dialogDesc={`Reject the reviewer application from ${r.fullName} (${r.email}). They will be notified via email.`}
                      confirmLabel="Reject"
                      isPending={rejectMutation.isPending}
                      onConfirm={() => rejectMutation.mutate(r._id)}
                      triggerVariant="outline"
                      triggerClassName="text-destructive hover:text-destructive border-destructive/40"
                      confirmVariant="destructive"
                    />
                  </ReviewerCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Active Reviewers ─────────── */}
          <TabsContent value="reviewers">
            <SectionHeader title="Active Reviewers" desc="Currently verified reviewers who can be assigned blogs." />
            {verifiedLoading ? <TabSkeleton /> : fVerified.length === 0 ? (
              <EmptyState icon={<Users />} msg={q ? `No results for "${search}".` : "No active reviewers."} />
            ) : (
              <div className="space-y-3">
                {fVerified.map((r) => (
                  <ReviewerCard key={r._id} reviewer={r}>
                    <ConfirmActionButton
                      label="Remove"
                      icon={<UserX className="size-3.5" />}
                      dialogTitle="Remove reviewer?"
                      dialogDesc={`Revoke reviewer access for ${r.fullName} (${r.email}). Their role will revert to regular user.`}
                      confirmLabel="Remove"
                      isPending={removeMutation.isPending}
                      onConfirm={() => removeMutation.mutate(r._id)}
                      triggerVariant="ghost"
                      triggerClassName="text-destructive hover:text-destructive"
                      confirmVariant="destructive"
                    />
                  </ReviewerCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Users ────────────────────── */}
          <TabsContent value="users">
            <SectionHeader title="Registered Users" desc="All user accounts on BloggerSpace, including inactive ones." />
            {usersLoading ? <TabSkeleton /> : fUsers.length === 0 ? (
              <EmptyState icon={<Users />} msg={q ? `No results for "${search}".` : "No users found."} />
            ) : (
              <div className="space-y-3">
                {fUsers.map((u) => (
                  <UserCard key={u._id} user={u}>
                    {u.status === "INACTIVE" ? (
                      <ConfirmActionButton
                        label="Reactivate"
                        icon={<RotateCcw className="size-3.5" />}
                        dialogTitle="Reactivate account?"
                        dialogDesc={`Restore login access for ${u.fullName} (${u.email}). They will be able to sign in again.`}
                        confirmLabel="Reactivate"
                        isPending={reactivateMutation.isPending}
                        onConfirm={() => reactivateMutation.mutate(u._id)}
                        triggerVariant="outline"
                        confirmVariant="default"
                      />
                    ) : (
                      <ConfirmActionButton
                        label="Deactivate"
                        icon={<Ban className="size-3.5" />}
                        dialogTitle="Deactivate account?"
                        dialogDesc={`Temporarily disable ${u.fullName}'s (${u.email}) account. They will be unable to log in until reactivated.`}
                        confirmLabel="Deactivate"
                        isPending={deactivateMutation.isPending}
                        onConfirm={() => deactivateMutation.mutate(u._id)}
                        triggerVariant="outline"
                        triggerClassName="text-amber-600 hover:text-amber-600 border-amber-300 dark:border-amber-700"
                        confirmVariant="destructive"
                      />
                    )}
                    <ConfirmActionButton
                      label="Delete"
                      icon={<Trash2 className="size-3.5" />}
                      dialogTitle="Permanently delete user?"
                      dialogDesc={`This will permanently delete "${u.fullName}" (${u.email}) and all their data. This cannot be undone.`}
                      confirmLabel="Delete permanently"
                      isPending={deleteUserMutation.isPending}
                      onConfirm={() => deleteUserMutation.mutate({ userId: u._id, email: u.email })}
                      triggerVariant="ghost"
                      triggerClassName="text-destructive hover:text-destructive"
                      confirmVariant="destructive"
                    />
                  </UserCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      
    </main>
  );
}

/* ─── sub-components ──────────────────────────────────────────────── */

function SearchInput({ search, setSearch, placeholder }: { search: string; setSearch: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative mb-5">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
      />
      {search && (
        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function ReviewerCard({ reviewer, children }: { reviewer: ReviewerItem; children: React.ReactNode }) {
  const statusColor =
    reviewer.reviewerStatus === "approved"
      ? "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700"
      : reviewer.reviewerStatus === "pending"
      ? "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
      : "text-destructive border-destructive/40";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <Link
            href={`/admin/manage/team/${reviewer._id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {reviewer.fullName}
          </Link>
          {reviewer.isVerified ? (
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
              <ShieldCheck className="size-3 mr-1" />Email verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              <AlertCircle className="size-3 mr-1" />Email unverified
            </Badge>
          )}
          {reviewer.reviewerStatus && reviewer.reviewerStatus !== "none" && (
            <Badge variant="outline" className={`text-xs h-5 px-1.5 capitalize ${statusColor}`}>
              {reviewer.reviewerStatus}
            </Badge>
          )}
          {reviewer.authType && <AuthTypeBadge authType={reviewer.authType} />}
        </div>
        <p className="text-xs text-muted-foreground">
          <Link href={`/admin/manage/team/${reviewer._id}`} className="hover:text-primary transition-colors">@{reviewer.userName}</Link>
          {" · "}
          <Link href={`/admin/manage/team/${reviewer._id}`} className="hover:text-primary transition-colors">{reviewer.email}</Link>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {reviewer.reviewedBlogs?.length ?? 0} blogs reviewed · Joined {formatDate(reviewer.createdAt)}
          {reviewer.lastLogin && <> · <LogIn className="size-3 inline mr-0.5" />Last login {formatDate(reviewer.lastLogin)}</>}
        </p>
        <ReverifyLine authType={reviewer.authType} lastVerifiedAt={reviewer.lastVerifiedAt} />
        {typeof reviewer.gems === "number" && (
          <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
            <Gem className="size-3" />{reviewer.gems} gems
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href={`/admin/manage/team/${reviewer._id}`}><Eye className="size-3.5" />View</Link>
        </Button>
        {children}
      </div>
    </div>
  );
}

function UserCard({ user, children }: { user: UserItem; children: React.ReactNode }) {
  const isInactive = user.status === "INACTIVE";
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border bg-card p-4 ${isInactive ? "border-amber-200 dark:border-amber-800/40 opacity-80" : "border-border"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <Link
            href={`/admin/manage/team/${user._id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {user.fullName}
          </Link>
          {user.isVerified && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
              <ShieldCheck className="size-3 mr-1" />Verified
            </Badge>
          )}
          {isInactive && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              Inactive
            </Badge>
          )}
          {user.role && user.role !== "user" && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5 capitalize">{user.role}</Badge>
          )}
          {user.authType && <AuthTypeBadge authType={user.authType} />}
        </div>
        <p className="text-xs text-muted-foreground">
          <Link href={`/admin/manage/team/${user._id}`} className="hover:text-primary transition-colors">@{user.userName}</Link>
          {" · "}
          <Link href={`/admin/manage/team/${user._id}`} className="hover:text-primary transition-colors">{user.email}</Link>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <Clock className="size-3 inline mr-1" />Joined {formatDate(user.createdAt)}
          {user.lastLogin && <> · <LogIn className="size-3 inline mr-0.5" />Last login {formatDate(user.lastLogin)}</>}
        </p>
        <ReverifyLine authType={user.authType} lastVerifiedAt={user.lastVerifiedAt} />
        {typeof user.gems === "number" && (
          <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
            <Gem className="size-3" />{user.gems} gems
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href={`/admin/manage/team/${user._id}`}><Eye className="size-3.5" />View</Link>
        </Button>
        {children}
      </div>
    </div>
  );
}

function AuthTypeBadge({ authType }: { authType: string }) {
  const map: Record<string, string> = {
    Email:  "text-slate-600 border-slate-300 dark:text-slate-300 dark:border-slate-600",
    Google: "text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700",
    Github: "text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-700",
  };
  const cls = map[authType] ?? map.Email;
  return (
    <Badge variant="outline" className={`text-xs h-5 px-1.5 ${cls}`}>
      {authType}
    </Badge>
  );
}

// Shows the re-verification clock for Email/password users (the only ones it applies to).
// OAuth users auto-refresh on every login, so the clock is not meaningful for them.
function ReverifyLine({ authType, lastVerifiedAt }: { authType?: string; lastVerifiedAt?: string | null }) {
  const isEmailAuth = !authType || authType === "Email";
  if (!isEmailAuth) {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        <ShieldCheck className="size-3 inline mr-1 text-green-600 dark:text-green-400" />
        Auto-verified via {authType}
      </p>
    );
  }

  if (!lastVerifiedAt) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
        <AlertCircle className="size-3 inline mr-1" />
        Never re-verified
      </p>
    );
  }

  const daysAgo = Math.floor((Date.now() - new Date(lastVerifiedAt).getTime()) / 86_400_000);
  return (
    <p className="text-xs text-muted-foreground mt-0.5">
      <ShieldCheck className="size-3 inline mr-1" />
      Last verified {formatDate(lastVerifiedAt)} ({daysAgo}d ago)
    </p>
  );
}

function EmptyState({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}

function TabSkeleton() {
  return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
}

function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    </div>
  );
}

/* ─── Generic confirm action button ──────────────────────────────── */
function ConfirmActionButton({
  label, icon, dialogTitle, dialogDesc, confirmLabel,
  isPending, onConfirm,
  triggerVariant = "default",
  triggerClassName = "",
  confirmVariant = "destructive",
}: {
  label: string;
  icon?: React.ReactNode;
  dialogTitle: string;
  dialogDesc: string;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  triggerVariant?: "default" | "destructive" | "outline" | "ghost";
  triggerClassName?: string;
  confirmVariant?: "default" | "destructive";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant={triggerVariant} size="sm" className={`gap-1.5 ${triggerClassName}`} disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : icon}
          {label}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">{dialogTitle}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">{dialogDesc}</Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
            <Button
              variant={confirmVariant}
              size="sm"
              disabled={isPending}
              onClick={() => { onConfirm(); setOpen(false); }}
              className="gap-1.5"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : icon}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  Users, UserCheck, UserX, Loader2, Trash2, Clock,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type ReviewerItem, type UserItem } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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

  const approveMutation = useMutation({
    mutationFn: (reviewerId: string) => adminApi.approveReviewer(reviewerId, adminId),
    onSuccess: () => {
      toast.success("Reviewer approved.");
      qc.invalidateQueries({ queryKey: ["admin-pending-reviewers", "admin-verified-reviewers"] });
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
      toast.success("User removed.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold mb-6">Team Management</h1>

      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <Tabs defaultValue="pending">
          <TabsList className="flex w-max gap-1 mb-6">
            <TabsTrigger value="pending">
              <UserCheck className="size-3.5 mr-1.5" />Pending ({pendingReviewers.length})
            </TabsTrigger>
            <TabsTrigger value="reviewers">
              <Users className="size-3.5 mr-1.5" />Active Reviewers ({verifiedReviewers.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-3.5 mr-1.5" />Users ({users.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Pending Reviewer Requests ─── */}
          <TabsContent value="pending">
            <SectionHeader title="Pending Reviewer Requests" desc="New reviewer sign-up requests awaiting your approval." />
            {pendingLoading ? <TabSkeleton /> : pendingReviewers.length === 0 ? (
              <EmptyState icon={<UserCheck />} msg="No pending reviewer requests." />
            ) : (
              <div className="space-y-3">
                {pendingReviewers.map((r) => (
                  <ReviewerCard key={r._id} reviewer={r}>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(r._id)}
                    >
                      {approveMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                      Approve
                    </Button>
                  </ReviewerCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Active Reviewers ─────────── */}
          <TabsContent value="reviewers">
            <SectionHeader title="Active Reviewers" desc="Currently verified reviewers who can be assigned blogs." />
            {verifiedLoading ? <TabSkeleton /> : verifiedReviewers.length === 0 ? (
              <EmptyState icon={<Users />} msg="No active reviewers." />
            ) : (
              <div className="space-y-3">
                {verifiedReviewers.map((r) => (
                  <ReviewerCard key={r._id} reviewer={r}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(r._id)}
                    >
                      {removeMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserX className="size-3.5" />}
                      Remove
                    </Button>
                  </ReviewerCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Users ────────────────────── */}
          <TabsContent value="users">
            <SectionHeader title="Registered Users" desc="All active user accounts on BloggerSpace." />
            {usersLoading ? <TabSkeleton /> : users.length === 0 ? (
              <EmptyState icon={<Users />} msg="No users found." />
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <UserCard key={u._id} user={u}>
                    <DeleteConfirmButton
                      label="Remove user"
                      desc={`This will soft-delete "${u.fullName}" (${u.email}). They will no longer be able to log in.`}
                      isPending={deleteUserMutation.isPending}
                      onConfirm={() => deleteUserMutation.mutate({ userId: u._id, email: u.email })}
                    />
                  </UserCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/* ─── sub-components ──────────────────────────────────────────────── */

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function ReviewerCard({ reviewer, children }: { reviewer: ReviewerItem; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{reviewer.fullName}</p>
        <p className="text-xs text-muted-foreground">@{reviewer.userName} · {reviewer.email}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {reviewer.reviewedBlogs?.length ?? 0} blogs reviewed · Joined {formatDate(reviewer.createdAt)}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function UserCard({ user, children }: { user: UserItem; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{user.fullName}</p>
        <p className="text-xs text-muted-foreground">@{user.userName} · {user.email}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <Clock className="size-3 inline mr-1" />{formatDate(user.createdAt)}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
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

function DeleteConfirmButton({
  label, desc, isPending, onConfirm,
}: {
  label: string; desc: string; isPending: boolean; onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Dialog.Title className="font-serif text-lg font-semibold">{label}?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">{desc}</Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={() => { onConfirm(); setOpen(false); }} className="gap-1.5">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Confirm
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

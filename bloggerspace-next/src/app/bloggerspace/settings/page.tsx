"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Lock,
  Shield,
  AlertTriangle,
  Loader2,
  ChevronRight,
  BadgeCheck,
  Mail,
  Trash2,
} from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PushNotificationToggle } from "@/components/user/push-notification-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [deactivating, setDeactivating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userinfo"],
    queryFn: () => userApi.getInfo().then((r) => r.data),
    enabled: !!user,
  });

  const newsletterMutation = useMutation({
    mutationFn: (optIn: boolean) => userApi.setNewsletterOptIn(optIn),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ["userinfo"] });
    },
    onError: () => toast.error("Couldn't update preference. Try again."),
  });

  const handleDeactivate = async () => {
    if (!user) return;
    setDeactivating(true);
    try {
      await userApi.deactivateAccount(user._id);
      toast.success("Account deactivated. You have been signed out.");
      logout();
      router.push("/");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to deactivate account.")
          : "Something went wrong.",
      );
    } finally {
      setDeactivating(false);
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!user || confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      toast.success("Your account has been deleted. You have been signed out.");
      logout();
      router.push("/");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.error ?? err.response?.data?.message ?? "Failed to delete account.")
          : "Something went wrong.",
      );
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setConfirmText("");
    }
  };

  if (authLoading || profileLoading) return <SettingsSkeleton />;
  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight">Settings</h1>

      {/* Account overview */}
      <section className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Account
        </h2>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 font-medium">
                {profile?.fullName}
                {profile?.isVerified && (
                  <BadgeCheck className="size-4 fill-primary text-primary-foreground" />
                )}
              </p>
              <p className="text-sm text-muted-foreground">{profile?.email ?? user.email}</p>
              <p className="text-sm text-muted-foreground">@{profile?.userName ?? "—"}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {profile?.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Manage
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <SettingsRow
            icon={<UserIcon className="size-4" />}
            label="Edit profile"
            description="Update your name, username, and photo"
            href="/bloggerspace/profile"
          />
          <Separator />
          <SettingsRow
            icon={<Lock className="size-4" />}
            label="Change password"
            description="Update your account password"
            href="/bloggerspace/security"
          />
          <Separator />
          <SettingsRow
            icon={<Shield className="size-4" />}
            label="My blogs"
            description="Manage your published and draft blogs"
            href="/bloggerspace/myblogs"
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Notifications
        </h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Mail className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Newsletter</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Get occasional emails about new posts and updates. You can opt out anytime.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!profile?.newsletterOptIn}
                disabled={newsletterMutation.isPending}
                onClick={() => newsletterMutation.mutate(!profile?.newsletterOptIn)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                  profile?.newsletterOptIn ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                    profile?.newsletterOptIn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <PushNotificationToggle />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-destructive">
          Danger zone
        </h2>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium text-foreground">
                <AlertTriangle className="size-4 text-destructive" />
                Deactivate account
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your account will be set to inactive. You will be signed out immediately. Contact
                support to reactivate.
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  Deactivate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deactivate your account?</DialogTitle>
                  <DialogDescription>
                    Your account will be set to inactive. You will be signed out immediately.
                    Your blogs and data will be preserved. Contact us to reactivate your account.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={deactivating}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
                    {deactivating && <Loader2 className="size-4 animate-spin" />}
                    Yes, deactivate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Separator className="my-5 bg-destructive/20" />

          {/* Delete account */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Trash2 className="size-4 text-destructive" />
                Delete account
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently delete your account. This cannot be undone — your published posts will be
                anonymised and your data removed after a 7-day grace period.
              </p>
            </div>

            <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setConfirmText(""); }}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0 gap-1.5">
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="size-5" />
                    Delete your account permanently?
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-2 text-sm">
                      <p>
                        This action is <strong className="text-destructive">irreversible</strong>. You will be
                        signed out immediately and will lose access to your account.
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        <li>Your published blogs stay live but are <strong>anonymised</strong> right away.</li>
                        <li>Your profile, bio, saved blogs, and reading history are removed.</li>
                        <li>Your account is permanently purged after <strong>7 days</strong>; an admin may remove it sooner.</li>
                      </ul>
                      <p>
                        Type <strong>DELETE</strong> below to confirm.
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoComplete="off"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDeleteOpen(false); setConfirmText(""); }} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting || confirmText !== "DELETE"} className="gap-1.5">
                    {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Delete my account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </main>
  );
}

function SettingsRow({
  icon,
  label,
  description,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 bg-card px-5 py-4 transition-colors hover:bg-muted/50">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

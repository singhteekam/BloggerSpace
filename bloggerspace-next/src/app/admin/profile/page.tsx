"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Camera, CheckCircle2, BadgeCheck, CalendarDays, ShieldCheck, KeyRound } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useAuth } from "@/contexts/auth-context";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  userName: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(20, "Maximum 20 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
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

export default function AdminProfilePage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  const { login } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["admin-profile-info"],
    queryFn: () => adminApi.getAdminInfo(user!._id).then((r) => r.data),
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: profile ? { fullName: profile.fullName, userName: profile.userName ?? "" } : undefined,
  });

  const picMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadAdminProfilePicture(user!._id, file),
    onSuccess: () => {
      toast.success("Profile picture updated.");
      qc.invalidateQueries({ queryKey: ["admin-profile-info"] });
    },
    onError: () => toast.error("Failed to upload picture. Ensure it is under 5 MB."),
  });

  const onSave = async (data: FormValues) => {
    if (!user) return;
    try {
      const res = await adminApi.updateAdminProfile(user._id, data);
      login(localStorage.getItem("bs.token")!, res.data.adminDetails);
      qc.invalidateQueries({ queryKey: ["admin-profile-info"] });
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

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight">My profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <UserAvatar
            src={profile?.profilePicture}
            name={profile?.fullName ?? user.fullName ?? "A"}
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

        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold">{profile?.fullName ?? user.fullName}</p>
            {profile?.isVerified && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs text-primary">
                <BadgeCheck className="size-3 fill-primary text-primary-foreground" />
                Verified
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
              <ShieldCheck className="size-3 text-primary" />
              Administrator
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">@{profile?.userName ?? user.userName ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{profile?.email ?? user.email}</p>
          {joinedDate && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Joined {joinedDate}
            </p>
          )}
        </div>
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

      <Separator className="my-8" />

      {/* Login security key */}
      <SecurityKeySection
        adminId={user._id}
        hasKey={!!profile?.hasSecurityKey}
        onChanged={() => qc.invalidateQueries({ queryKey: ["admin-profile-info"] })}
      />
    </main>
  );
}

function SecurityKeySection({
  adminId,
  hasKey,
  onChanged,
}: {
  adminId: string;
  hasKey: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newKey, setNewKey] = useState("");

  const mutation = useMutation({
    mutationFn: () => adminApi.updateSecurityKey(adminId, { currentPassword, newKey }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setOpen(false);
      setCurrentPassword("");
      setNewKey("");
      onChanged();
    },
    onError: (err) =>
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed.") : "Error."),
  });

  // Allow an empty key only when one already exists (to remove it).
  const keyValid = newKey === "" ? hasKey : /^\d{6}$/.test(newKey);
  const canSubmit = currentPassword.length > 0 && keyValid;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <KeyRound className="size-4" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              Login security key
              {hasKey && (
                <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] text-primary">
                  <ShieldCheck className="size-3" />Active
                </Badge>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hasKey
                ? "A 6-digit key is required alongside your password at login."
                : "Add a 6-digit key required at login for an extra layer of security."}
            </p>
          </div>
        </div>
        {!open && (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
            {hasKey ? "Change" : "Set up"}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="curpw">Current password</Label>
            <Input id="curpw" type="password" autoComplete="current-password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newkey">New 6-digit key</Label>
            <Input id="newkey" inputMode="numeric" maxLength={6} placeholder="e.g. 123456"
              value={newKey} onChange={(e) => setNewKey(e.target.value.replace(/\D/g, ""))} />
            <p className="text-xs text-muted-foreground">
              {hasKey ? "Leave blank to remove the security key." : "Must be exactly 6 digits."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Save
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => { setOpen(false); setCurrentPassword(""); setNewKey(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

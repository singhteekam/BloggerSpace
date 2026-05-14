"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Camera, CheckCircle2, BadgeCheck, CalendarDays } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
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

export default function MyProfilePage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { login } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userinfo"],
    queryFn: () => userApi.getInfo().then((r) => r.data),
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
      const res = await userApi.updateProfile(user._id, data);
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight">My profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-6">
        <div className="relative">
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

        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold">{profile?.fullName}</p>
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
          <p className="text-sm text-muted-foreground">@{profile?.userName ?? "—"}</p>
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

      {/* Delete account — hidden for now */}
      {/* <Separator className="my-8" />
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
        <div>
          <p className="font-semibold text-destructive">Danger zone</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Permanently delete your account. This action cannot be undone.
          </p>
        </div>
        <Button variant="destructive" size="sm" className="gap-1.5">
          Delete account
        </Button>
      </div> */}
    </main>
  );
}

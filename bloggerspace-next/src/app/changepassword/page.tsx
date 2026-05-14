"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { user, isLoading } = useRequireAuth();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post("/api/users/changepassword", { oldPassword: data.oldPassword, newPassword: data.newPassword });
      toast.success("Password changed successfully.");
      reset();
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to change password.") : "Error.");
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (!user) return null;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-5" />
        </div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Change password</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="oldPassword">Current password</Label>
            <div className="relative">
              <Input id="oldPassword" type={showOld ? "text" : "password"} className="pr-10" placeholder="••••••••" {...register("oldPassword")} />
              <button type="button" onClick={() => setShowOld((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showOld ? "Hide" : "Show"}>
                {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.oldPassword && <p className="text-xs text-destructive">{errors.oldPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input id="newPassword" type={showNew ? "text" : "password"} className="pr-10" placeholder="••••••••" {...register("newPassword")} />
              <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showNew ? "Hide" : "Show"}>
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </main>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-md px-6 py-12 space-y-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

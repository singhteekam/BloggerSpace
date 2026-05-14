"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    if (!token) return;
    try {
      await authApi.resetPassword(token, data.newPassword);
      toast.success("Password reset! You can now sign in.");
      router.push("/login");
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Reset failed. The link may have expired.")
        : "Something went wrong.";
      toast.error(message);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <h1 className="font-serif text-xl font-semibold">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This link is missing a reset token. Request a new one from the forgot password page.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link href="/forgotpassword">Request new link</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

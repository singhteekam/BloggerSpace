"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { env } from "@/lib/env";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

const schema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${env.NEXT_PUBLIC_BACKEND_URL}/api/users/auth/${provider}`;
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await authApi.signup({
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        password: data.password,
      });

      const email = encodeURIComponent(data.email.toLowerCase());

      if (res.status === 200) {
        // Existing unverified account — inform the user their email is already registered
        toast.info("An account with this email already exists but wasn't verified. We've sent a new code to your email.");
      } else {
        // 201 — brand new account
        toast.success("Account created! Check your email for the verification code.");
      }

      router.push(`/verify-otp?email=${email}`);
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Signup failed. Please try again.")
        : "Something went wrong.";
      toast.error(message);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join BloggerSpace — it&apos;s free.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Teekam Singh"
                autoComplete="name"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Password strength checklist */}
              {passwordValue.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordRules.map(({ label, test }) => {
                    const ok = test(passwordValue);
                    return (
                      <li key={label} className="flex items-center gap-1.5 text-xs">
                        {ok ? (
                          <CheckCircle2 className="size-3.5 text-success" />
                        ) : (
                          <XCircle className="size-3.5 text-muted-foreground" />
                        )}
                        <span className={ok ? "text-foreground" : "text-muted-foreground"}>
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {errors.password && !passwordValue.length && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
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
              Create account
            </Button>
          </form>

          <div className="relative my-5 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="mx-3 text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => handleOAuth("google")}
            >
              <FaGoogle className="size-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => handleOAuth("github")}
            >
              <FaGithub className="size-4" />
              GitHub
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <Link href="/termsandconditions" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacypolicy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api/auth";
import { env } from "@/lib/env";

// Note: metadata export is ignored in client components — SEO handled in a
// separate generateMetadata or a server wrapper if needed.

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${env.NEXT_PUBLIC_BACKEND_URL}/api/users/auth/${provider}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await authApi.login(data);
      const { token, userDetails } = res.data;

      if (!userDetails.isVerified) {
        toast.error("Your email is not verified. Please check your inbox.");
        return;
      }

      login(token, userDetails);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err) {
      if (
        isAxiosError(err) &&
        err.response?.status === 403 &&
        err.response.data?.message === "otp_required"
      ) {
        // Account exists but email is not yet verified — redirect to OTP page
        toast.info("Your email isn't verified. We've sent a code to your email.");
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        return;
      }
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Login failed. Check your credentials.")
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
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your BloggerSpace account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgotpassword" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Sign in
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
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up free
          </Link>
        </p>

        <Separator className="my-5" />

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>
            Are you a reviewer?{" "}
            <Link href="/reviewer/login" className="text-primary hover:underline">
              Sign in
            </Link>
            {" · "}
            <Link href="/apply-reviewer" className="text-primary hover:underline">
              Apply now
            </Link>
          </p>
          <p>
            Are you an admin?{" "}
            <Link href="/admin/login" className="text-primary hover:underline">
              Admin portal
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

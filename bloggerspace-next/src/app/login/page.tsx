"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, KeyRound, ArrowLeft, ShieldAlert } from "lucide-react";
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

type LoginMode = "password" | "otp-request" | "otp-verify";

// ── Password login ────────────────────────────────────────────────────────────
const passSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type PassForm = z.infer<typeof passSchema>;

// ── OTP login ─────────────────────────────────────────────────────────────────
const otpRequestSchema = z.object({ email: z.string().email("Invalid email address") });
type OtpRequestForm = z.infer<typeof otpRequestSchema>;

const otpVerifySchema = z.object({
  otp: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Digits only"),
});
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDeactivated = searchParams.get("reason") === "deactivated";
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState<LoginMode>("password");
  const [otpEmail, setOtpEmail] = useState("");

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${env.NEXT_PUBLIC_BACKEND_URL}/api/users/auth/${provider}`;
  };

  const handleLoginSuccess = (token: string, userDetails: Parameters<typeof login>[1]) => {
    login(token, userDetails);
    if (userDetails.role === "reviewer") {
      toast.success("Welcome back! Redirecting to Reviewer Dashboard…");
      router.push("/reviewer");
    } else {
      toast.success("Welcome back!");
      router.push("/");
    }
  };

  // ── Password form ──────────────────────────────────────────────────────────
  const passForm = useForm<PassForm>({ resolver: zodResolver(passSchema) });

  const onPasswordSubmit = async (data: PassForm) => {
    try {
      const res = await authApi.login(data);
      const { token, userDetails } = res.data;
      handleLoginSuccess(token, userDetails);
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message ?? "";
        if (err.response?.status === 403 && msg === "otp_required") {
          toast.info("Your email isn't verified. We've sent a code to your email.");
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
          return;
        }
        if (err.response?.status === 403 && msg === "reverification_required") {
          toast.info("Periodic re-verification required. A code has been sent to your email.");
          router.push(`/reverify?email=${encodeURIComponent(data.email)}`);
          return;
        }
        if (err.response?.status === 403 && msg === "reverify_locked") {
          toast.error("Too many failed attempts. Please try again in 30 minutes.");
          return;
        }
        if (err.response?.status === 403 && msg === "account_deactivated") {
          toast.error("Your account has been deactivated. Please contact support.");
          return;
        }
      }
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Login failed. Check your credentials.")
          : "Something went wrong.",
      );
    }
  };

  // ── OTP request form ───────────────────────────────────────────────────────
  const otpReqForm = useForm<OtpRequestForm>({ resolver: zodResolver(otpRequestSchema) });

  const onOtpRequest = async (data: OtpRequestForm) => {
    try {
      await authApi.requestLoginOtp(data.email);
      setOtpEmail(data.email);
      setMode("otp-verify");
      toast.success("Code sent! Check your email.");
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message ?? "";
        if (err.response?.status === 403 && msg === "account_deactivated") {
          toast.error("Your account has been deactivated. Please contact support.");
          return;
        }
      }
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to send code.")
          : "Something went wrong.",
      );
    }
  };

  // ── OTP verify form ────────────────────────────────────────────────────────
  const otpVerifyForm = useForm<OtpVerifyForm>({ resolver: zodResolver(otpVerifySchema) });

  const onOtpVerify = async (data: OtpVerifyForm) => {
    try {
      const res = await authApi.verifyLoginOtp(otpEmail, data.otp);
      const { token, userDetails } = res.data;
      handleLoginSuccess(token, userDetails);
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Invalid or expired code.")
          : "Something went wrong.",
      );
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {/* Account deactivated banner — shown when redirected from a 401 deactivation */}
        {isDeactivated && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Account deactivated</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your account has been deactivated. Please contact support for reactivation.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* ── Mode: OTP verify ── */}
          {mode === "otp-verify" && (
            <>
              <button
                onClick={() => setMode("otp-request")}
                className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3" />Back
              </button>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 mb-3">
                <KeyRound className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Enter your code</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{otpEmail}</span>.
              </p>
              <form onSubmit={otpVerifyForm.handleSubmit(onOtpVerify)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                    {...otpVerifyForm.register("otp")}
                  />
                  {otpVerifyForm.formState.errors.otp && (
                    <p className="text-xs text-destructive">{otpVerifyForm.formState.errors.otp.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={otpVerifyForm.formState.isSubmitting}>
                  {otpVerifyForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={() => setMode("otp-request")}
                  className="text-primary hover:underline"
                >
                  Resend code
                </button>
              </p>
            </>
          )}

          {/* ── Mode: OTP request ── */}
          {mode === "otp-request" && (
            <>
              <button
                onClick={() => setMode("password")}
                className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3" />Back to password sign in
              </button>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Mail className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Sign in with code</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send a one-time sign-in code.
              </p>
              <form onSubmit={otpReqForm.handleSubmit(onOtpRequest)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="you@example.com"
                    autoFocus
                    {...otpReqForm.register("email")}
                  />
                  {otpReqForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{otpReqForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={otpReqForm.formState.isSubmitting}>
                  {otpReqForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Send code
                </Button>
              </form>
            </>
          )}

          {/* ── Mode: Password (default) ── */}
          {mode === "password" && (
            <>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your BloggerSpace account
              </p>

              <form onSubmit={passForm.handleSubmit(onPasswordSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...passForm.register("email")}
                  />
                  {passForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{passForm.formState.errors.email.message}</p>
                  )}
                </div>

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
                      {...passForm.register("password")}
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
                  {passForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{passForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={passForm.formState.isSubmitting}>
                  {passForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Sign in
                </Button>
              </form>

              <button
                onClick={() => setMode("otp-request")}
                className="mt-3 w-full text-center text-xs text-primary hover:underline"
              >
                Sign in with email code instead
              </button>

              <div className="relative my-5 flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="mx-3 text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="gap-2" onClick={() => handleOAuth("google")}>
                  <FaGoogle className="size-4" />Google
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={() => handleOAuth("github")}>
                  <FaGithub className="size-4" />GitHub
                </Button>
              </div>
            </>
          )}
        </div>

        {mode === "password" && (
          <>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up free
              </Link>
            </p>

            <Separator className="my-5" />

            <div className="space-y-2 text-center text-xs text-muted-foreground">
              <p>
                Want to become a reviewer?{" "}
                <Link href="/bloggerspace/apply-reviewer" className="text-primary hover:underline">Apply now</Link>
              </p>
              <p>
                Are you an admin?{" "}
                <Link href="/admin/login" className="text-primary hover:underline">Admin portal</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

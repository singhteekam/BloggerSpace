"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

type Step = "email" | "otp" | "password" | "done";

const emailSchema = z.object({ email: z.string().email("Invalid email address") });
const otpSchema = z.object({ otp: z.string().length(6, "Must be 6 digits").regex(/^\d+$/, "Digits only") });
const passwordSchema = z.object({
  newPassword: z.string().min(6, "At least 6 characters"),
  confirm: z.string().min(1, "Confirm your password"),
}).refine((d) => d.newPassword === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      await authApi.forgotPasswordRequestOtp(data.email);
      setEmail(data.email);
      setStep("otp");
      toast.success("Reset code sent! Check your email.");
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message ?? "";
        if (err.response?.status === 403 && msg === "account_deactivated") {
          toast.error("Your account has been deactivated. Please contact support.");
          return;
        }
        if (err.response?.status === 403) {
          toast.error(err.response.data?.message ?? "Cannot reset password.");
          return;
        }
      }
      // For 404 or generic errors, show neutral message to prevent email enumeration
      setEmail(data.email);
      setStep("otp");
      toast.success("If that email is registered, a reset code has been sent.");
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    try {
      const res = await authApi.forgotPasswordVerifyOtp(email, data.otp);
      setResetToken(res.data.resetToken);
      setStep("password");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Invalid or expired code.")
          : "Something went wrong.",
      );
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await authApi.forgotPasswordReset(resetToken, data.newPassword);
      setStep("done");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to reset password.")
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

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Step: done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold">Password updated!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>
              </div>
              <Button className="w-full" onClick={() => router.push("/login")}>
                Back to sign in
              </Button>
            </div>
          )}

          {/* Step: set new password */}
          {step === "password" && (
            <>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 mb-3">
                <KeyRound className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Set new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoFocus
                      className="pr-10"
                      {...passwordForm.register("newPassword")}
                    />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...passwordForm.register("confirm")}
                    />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirm && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirm.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Set new password
                </Button>
              </form>
            </>
          )}

          {/* Step: enter OTP */}
          {step === "otp" && (
            <>
              <button onClick={() => setStep("email")}
                className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3" />Back
              </button>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Enter reset code</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                    {...otpForm.register("otp")}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-xs text-destructive">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={otpForm.formState.isSubmitting}>
                  {otpForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Verify code
                </Button>
              </form>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Didn&apos;t receive it?{" "}
                <button onClick={() => setStep("email")} className="text-primary hover:underline">
                  Resend code
                </button>
              </p>
            </>
          )}

          {/* Step: enter email */}
          {step === "email" && (
            <>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Forgot password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset code.
              </p>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    {...emailForm.register("email")}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={emailForm.formState.isSubmitting}>
                  {emailForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Send reset code
                </Button>
              </form>
            </>
          )}
        </div>

        {step !== "done" && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </main>
  );
}

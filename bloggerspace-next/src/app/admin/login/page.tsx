"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldCheck, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { adminApi } from "@/lib/api/admin";

type Step = "credentials" | "otp";

const credSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  // Optional here — required by the server only if the account has one configured.
  securityKey: z.string().regex(/^\d{6}$/, "Must be 6 digits").or(z.literal("")).optional(),
});
const otpSchema = z.object({
  otp: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Digits only"),
});

type CredForm = z.infer<typeof credSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<Step>("credentials");
  const [adminEmail, setAdminEmail] = useState("");
  const [resending, setResending] = useState(false);

  const credForm = useForm<CredForm>({ resolver: zodResolver(credSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const onCredentials = async (data: CredForm) => {
    try {
      // OTP FLOW TEMPORARILY DISABLED — direct login
      // To re-enable: uncomment the OTP block and remove the direct-login block
      /*
      await adminApi.login(data);
      setAdminEmail(data.email);
      setStep("otp");
      toast.success("Verification code sent to your email.");
      */
      const res = await adminApi.login({
        email: data.email,
        password: data.password,
        securityKey: data.securityKey || undefined,
      });
      login(res.data.token, res.data.adminDetails);
      toast.success("Welcome, Admin!");
      router.push("/admin/dashboard");
    } catch (err) {
      const msg = isAxiosError(err) ? (err.response?.data?.message ?? "") : "";
      if (msg === "security_key_required") {
        toast.error("This account requires a 6-digit security key. Please enter it.");
        return;
      }
      toast.error(msg || "Login failed.");
    }
  };

  const onOtpVerify = async (data: OtpForm) => {
    try {
      const res = await adminApi.verifyLoginOtp(adminEmail, data.otp);
      login(res.data.token, res.data.adminDetails);
      toast.success("Welcome, Admin!");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Invalid or expired code.") : "Something went wrong.");
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await adminApi.resendLoginOtp(adminEmail);
      toast.success("New code sent to your email.");
      otpForm.reset();
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to resend.") : "Something went wrong.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            Admin portal
          </Badge>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* ── Step 1: Credentials ── */}
          {step === "credentials" && (
            <>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Admin sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your credentials. A verification code will be sent to your email.
              </p>

              <form onSubmit={credForm.handleSubmit(onCredentials)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@example.com" autoComplete="email" autoFocus
                    {...credForm.register("email")} />
                  {credForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{credForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••"
                      autoComplete="current-password" className="pr-10" {...credForm.register("password")} />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? "Hide password" : "Show password"}>
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {credForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{credForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="securityKey">Security key</Label>
                  <Input id="securityKey" inputMode="numeric" maxLength={6} placeholder="6-digit key (if set)"
                    autoComplete="off" {...credForm.register("securityKey")} />
                  {credForm.formState.errors.securityKey && (
                    <p className="text-xs text-destructive">{credForm.formState.errors.securityKey.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Required only if you’ve set one in the Admin Panel.</p>
                </div>

                <Button type="submit" className="w-full" disabled={credForm.formState.isSubmitting}>
                  {credForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Continue
                </Button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <button onClick={() => setStep("credentials")}
                className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3" />Back
              </button>

              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 mb-3">
                <KeyRound className="size-5 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">Verify your identity</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A 6-digit code was sent to <span className="font-medium text-foreground">{adminEmail}</span>.
                Enter it below to complete sign-in.
              </p>

              <form onSubmit={otpForm.handleSubmit(onOtpVerify)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input id="otp" inputMode="numeric" maxLength={6} placeholder="000000" autoFocus
                    {...otpForm.register("otp")} />
                  {otpForm.formState.errors.otp && (
                    <p className="text-xs text-destructive">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={otpForm.formState.isSubmitting}>
                  {otpForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Sign in as admin
                </Button>
              </form>

              <button onClick={onResend} disabled={resending}
                className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50">
                {resending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                Resend code
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Code expires in 10 minutes.
              </p>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Not an admin?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">User sign in</Link>
        </p>
      </div>
    </main>
  );
}

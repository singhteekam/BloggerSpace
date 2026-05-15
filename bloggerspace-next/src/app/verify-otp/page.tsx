"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api/auth";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Read email from URL query param — using window.location directly to avoid Suspense wrapper
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await authApi.verifyOtp(email, otp);
      const { token, userDetails } = res.data;
      login(token, userDetails);
      toast.success("Email verified! Welcome to BloggerSpace.");
      router.replace("/");
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Verification failed. Please try again.")
        : "Something went wrong.";
      toast.error(message);
      // Clear the input on wrong OTP so user retypes cleanly
      if (isAxiosError(err) && err.response?.status === 400) {
        setOtp("");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authApi.resendOtp(email);
      toast.success("A new code has been sent to your email.");
      startCooldown();
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Failed to resend. Please try again.")
        : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="size-6" />
            </div>
          </div>

          <h1 className="text-center font-serif text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            We sent a 6-digit code to
            <br />
            <span className="font-medium text-foreground">{email || "your email"}</span>
          </p>

          <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              className="text-center font-mono text-2xl tracking-[0.5em]"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying && <Loader2 className="size-4 animate-spin" />}
              Verify email
            </Button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-auto p-0 text-sm text-primary hover:bg-transparent hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                  Sending…
                </>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                "Resend code"
              )}
            </Button>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Back to sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

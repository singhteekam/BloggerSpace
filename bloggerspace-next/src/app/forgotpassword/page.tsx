"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { isAxiosError } from "axios";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.forgotPassword(data.email);
      setSentTo(data.email);
      setSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      if (isAxiosError(err) && err.response?.status !== 404) {
        setSentTo(data.email);
        setSent(true);
      } else {
        setSentTo(data.email);
        setSent(true);
      }
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                <MailCheck className="size-6" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold tracking-tight">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for{" "}
                  <span className="font-medium text-foreground">{sentTo}</span>, we sent a
                  password reset link. It expires in 1 hour.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="font-serif text-2xl font-semibold tracking-tight">
                Forgot password?
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
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

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

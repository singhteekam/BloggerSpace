"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, Clock, Star } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api/client";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
  motivation: z.string().max(500, "Max 500 characters").optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function ApplyReviewerPage() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const motivationValue = watch("motivation", "");

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post("/api/reviewer/signup", {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        motivation: data.motivation ?? "",
      });
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Submission failed. Please try again.")
        : "Something went wrong.";
      toast.error(message);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Application received!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Thanks for applying to the BloggerSpace Reviewer Panel. We've sent a confirmation to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Our admin team will review your application and notify you once approved.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reviewer/login">Already approved? Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {/* What reviewers do — brief explainer */}
        <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            What reviewers do
          </h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Star className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Read and rate submitted blog posts for quality and accuracy
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Approve, request edits, or reject submissions before publishing
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Your application is reviewed by our admin team before activation
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Apply as reviewer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details below. Admin approval required before you can sign in.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Jane Smith"
                autoComplete="name"
                autoFocus
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
                  aria-label={showPass ? "Hide" : "Show"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
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
                  aria-label={showConfirm ? "Hide" : "Show"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Motivation (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="motivation">
                Why do you want to be a reviewer?{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="motivation"
                placeholder="Tell us briefly about your background or why you'd like to review blogs…"
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("motivation")}
              />
              <p className="text-right text-xs text-muted-foreground">
                {(motivationValue ?? "").length}/500
              </p>
              {errors.motivation && (
                <p className="text-xs text-destructive">{errors.motivation.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Submit application
            </Button>
          </form>
        </div>

        <Separator className="my-5" />

        <p className="text-center text-sm text-muted-foreground">
          Already approved?{" "}
          <Link href="/reviewer/login" className="font-medium text-primary hover:underline">
            Sign in to Reviewer portal
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Regular user?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}

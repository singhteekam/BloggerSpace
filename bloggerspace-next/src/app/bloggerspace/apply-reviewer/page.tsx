"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ShieldCheck, CheckCircle2, Clock, Star, AlertCircle, Loader2,
  BadgeCheck, ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api/auth";

export default function ApplyReviewerPage() {
  const { user, token, isLoading, login } = useAuth();
  const router = useRouter();
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.reviewerApply(motivation || undefined);
      if (user && token) {
        login(token, { ...user, reviewerStatus: "pending" });
      }
      setDone(true);
      toast.success("Application submitted!");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Submission failed. Please try again.")
          : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  if (done) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Application received!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Our admin team will review your application and notify you by email once approved.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            In the meantime, you can keep using BloggerSpace as a regular user.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => router.push("/")}>Back to home</Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
              Already a reviewer? Sign in to your account
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" />What reviewers do
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

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Apply as reviewer</h1>
            <p className="text-sm text-muted-foreground">
              You need a verified BloggerSpace account to apply as a reviewer.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full gap-1.5">
                <Link href="/login?redirect=/bloggerspace/apply-reviewer">
                  Sign in to apply <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Create account first</Link>
              </Button>
            </div>
          </div>

          <Separator className="my-5" />
          <p className="text-center text-sm text-muted-foreground">
            Already a reviewer?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (user.role === "reviewer" && user.reviewerStatus === "approved") {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <BadgeCheck className="size-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">You&apos;re already a reviewer!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your reviewer access is active. Head to the reviewer dashboard to get started.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push("/reviewer")}>
            Go to Reviewer Dashboard
          </Button>
        </div>
      </main>
    );
  }

  if (user.reviewerStatus === "pending") {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="size-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Application pending</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your reviewer application is already submitted and awaiting admin approval. We&apos;ll notify you by email.
          </p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </div>
      </main>
    );
  }

  if (!user.isVerified) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="size-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Verify your email first</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please verify your email address before applying as a reviewer. Check your inbox for the verification code.
          </p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(user.email)}`)}>
            Verify email
          </Button>
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

        <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />What reviewers do
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
              Admin approval required before reviewer access is granted
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Apply as reviewer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Applying as <span className="font-medium text-foreground">{user.fullName}</span> ({user.email}).
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="motivation">
                Why do you want to be a reviewer?{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Tell us briefly about your background or why you'd like to review blogs…"
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">{motivation.length}/500</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Submit application
            </Button>
          </form>
        </div>

        <Separator className="my-5" />
        <p className="text-center text-sm text-muted-foreground">
          Already a reviewer?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in to your account
          </Link>
        </p>
      </div>
    </main>
  );
}

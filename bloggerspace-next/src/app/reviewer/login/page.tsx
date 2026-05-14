"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api/auth";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function ReviewerLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      // Try new unified login first (User collection with reviewer role)
      try {
        const res = await authApi.login(data);
        const { token, userDetails } = res.data;
        const role = (userDetails.role ?? "").toLowerCase();
        if (role !== "reviewer") {
          toast.error("This account does not have reviewer access.");
          return;
        }
        login(token, { ...userDetails, role: "reviewer" });
        toast.success("Welcome back, reviewer!");
        router.push("/reviewer");
        return;
      } catch (userErr) {
        // If not found in User collection, try legacy reviewer endpoint
        if (isAxiosError(userErr) && userErr.response?.status === 404) {
          const res = await authApi.reviewerLogin(data);
          const { token, reviewerDetails } = res.data;
          login(token, { ...reviewerDetails, role: "reviewer" });
          toast.success("Welcome back, reviewer!");
          router.push("/reviewer");
          return;
        }
        throw userErr;
      }
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? "Login failed. Check your credentials.")
        : "Something went wrong.";
      toast.error(message);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            Reviewer portal
          </Badge>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Reviewer sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your reviewer dashboard to read and approve submissions.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="reviewer@example.com"
                autoComplete="email"
                autoFocus
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
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
              Sign in as reviewer
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Not yet a reviewer?{" "}
          <Link href="/apply-reviewer" className="font-medium text-primary hover:underline">
            Apply now
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

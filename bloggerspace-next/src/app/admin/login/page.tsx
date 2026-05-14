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
import { adminApi } from "@/lib/api/admin";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await adminApi.login(data);
      login(res.data.token, res.data.adminDetails);
      toast.success("Welcome, Admin!");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Login failed.") : "Something went wrong.");
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
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access the admin control panel.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" className="pr-10" {...register("password")} />
                <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPass ? "Hide password" : "Show password"}>
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Sign in as admin
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Not an admin?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">User sign in</Link>
        </p>
      </div>
    </main>
  );
}

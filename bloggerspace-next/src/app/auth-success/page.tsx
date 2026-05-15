"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { env } from "@/lib/env";
import type { AuthUser } from "@/lib/api/auth";

export default function AuthSuccessPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      toast.error("OAuth sign-in failed. Please try again.");
      router.replace("/login");
      return;
    }

    axios
      .get<AuthUser>(`${env.NEXT_PUBLIC_BACKEND_URL}/api/users/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        login(token, res.data);
        toast.success("Signed in successfully!");
        router.replace("/");
      })
      .catch(() => {
        toast.error("Could not complete sign-in. Please try again.");
        router.replace("/login");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Completing sign-in…</p>
      </div>
    </main>
  );
}

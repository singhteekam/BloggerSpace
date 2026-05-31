"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { userApi } from "@/lib/api/user";
import { Button } from "@/components/ui/button";

export function NewsletterCta() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Fresh opt-in status (cached under the shared "userinfo" key, usually warm)
  const { data: profile } = useQuery({
    queryKey: ["userinfo"],
    queryFn: () => userApi.getInfo().then((r) => r.data),
    enabled: !!user,
  });

  const subscribe = useMutation({
    mutationFn: () => userApi.setNewsletterOptIn(true),
    onSuccess: () => {
      toast.success("Subscribed! You'll get new posts in your inbox.");
      qc.invalidateQueries({ queryKey: ["userinfo"] });
    },
    onError: () => toast.error("Couldn't subscribe. Try again."),
  });

  // Already subscribed — no need to nag.
  if (user && profile?.newsletterOptIn) return null;

  return (
    <div className="my-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-5" />
        </span>
        <div>
          <p className="font-serif text-lg font-semibold">Enjoying the read?</p>
          <p className="text-sm text-muted-foreground">
            Get new posts delivered straight to your inbox. No spam, opt out anytime.
          </p>
        </div>
      </div>

      {user ? (
        <Button
          onClick={() => subscribe.mutate()}
          disabled={subscribe.isPending}
          className="shrink-0 gap-1.5"
        >
          {subscribe.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Subscribe
        </Button>
      ) : (
        <Button asChild className="shrink-0 gap-1.5">
          <Link href="/login">
            <Mail className="size-4" />
            Sign in to subscribe
          </Link>
        </Button>
      )}
    </div>
  );
}

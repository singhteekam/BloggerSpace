"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants/site";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Phase 13 will wire Sentry. For now, log to console for dev visibility.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        Something broke on our end.
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {siteConfig.name} hit an unexpected error rendering this page. Try again, or head home and
        we&apos;ll keep an eye on it.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => reset()}>
          <RotateCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="size-4" />
            Go home
          </Link>
        </Button>
      </div>
    </main>
  );
}

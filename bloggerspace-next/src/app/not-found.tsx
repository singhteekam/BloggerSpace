import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
        404 · Not found
      </p>
      <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
        This page wandered off.
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The link may be broken, the post may have been removed, or you may have mistyped the URL.
        Try searching, or head back to the home page.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/blogs">
            <Compass className="size-4" />
            Browse blogs
          </Link>
        </Button>
      </div>
    </main>
  );
}

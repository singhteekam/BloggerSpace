import type { Metadata } from "next";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Under Maintenance — BloggerSpace",
  description: "We're doing some work to improve the experience. Back soon!",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Icon */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Wrench className="size-10" />
      </div>

      {/* Wordmark */}
      <p className="mb-2 font-serif text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        BloggerSpace
      </p>

      {/* Heading */}
      <h1 className="mb-3 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Under Maintenance
      </h1>

      {/* Message */}
      <p className="max-w-md text-base text-muted-foreground">
        We&rsquo;re doing some improvements to make the experience better for you. We&rsquo;ll be
        back shortly — thank you for your patience!
      </p>

      {/* Divider */}
      <div className="my-8 h-px w-16 bg-border" />

      <p className="text-sm text-muted-foreground">
        Are you an admin?{" "}
        <a
          href="/admin/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in here
        </a>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { Badge } from "@/components/ui/badge";
import { WriteReviewButton } from "@/app/_sections/write-review-button";
import { AllReviewsList } from "./_list";

export const metadata: Metadata = pageMetadata({
  title: "Reviews",
  description:
    "Read what writers and reviewers say about their experience on BloggerSpace by Teekam Singh — honest reviews of the reviewed-blogging platform.",
  path: "/reviews",
  keywords: ["bloggerspace reviews", "platform reviews", "writer testimonials", "user reviews"],
});

export default function AllReviewsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Reviews</Badge>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            What our users say
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real feedback from writers and reviewers who call BloggerSpace home.
          </p>
        </div>
        <WriteReviewButton />
      </div>

      <AllReviewsList />
    </main>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

// Public "become a reviewer" page (a client component) — indexable even though
// it lives under the otherwise-private /bloggerspace space (see the index
// exception in proxy.ts). This layout supplies its SEO/social metadata.
export const metadata: Metadata = pageMetadata({
  title: "Become a Reviewer",
  description:
    "Apply to become a BloggerSpace reviewer — help maintain content quality by reviewing blog submissions before they go live, and earn gems for great reviews.",
  path: "/bloggerspace/apply-reviewer",
  keywords: [
    "become a reviewer",
    "bloggerspace reviewer",
    "apply to be a reviewer",
    "blog reviewer",
    "content reviewer",
    "review blogs online",
  ],
});

export default function ApplyReviewerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

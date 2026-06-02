import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

// The community page itself is a client component (can't export metadata), so
// this layout supplies its SEO/social tags. Individual community-post pages
// override this with their own generateMetadata.
export const metadata: Metadata = pageMetadata({
  title: "Community",
  description:
    "Join the BloggerSpace community by Teekam Singh — discussions, questions, and ideas shared by writers and readers on technology, careers, and more.",
  path: "/community",
  keywords: ["blogging community", "writers community", "tech community", "community discussions", "ask questions"],
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description: "Discussions, questions, and ideas from the BloggerSpace community. Ask, answer, and connect.",
  openGraph: {
    title: "Community · BloggerSpace",
    description: "Discussions, questions, and ideas from the BloggerSpace community.",
    type: "website",
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

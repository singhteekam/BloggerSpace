import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Sign In",
  description:
    "Sign in to your BloggerSpace account to write, save, and engage with the community of reviewed blogs by Teekam Singh.",
  path: "/login",
  keywords: ["bloggerspace login", "bloggerspace sign in", "login", "sign in", "blogger space login"],
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Create Account",
  description:
    "Join BloggerSpace by Teekam Singh — write thoughtful articles, get reviewed by real people before you publish, and build your readership. Free to sign up.",
  path: "/signup",
  keywords: [
    "bloggerspace sign up",
    "bloggerspace register",
    "create account",
    "join bloggerspace",
    "start blogging free",
    "sign up to write blogs",
  ],
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

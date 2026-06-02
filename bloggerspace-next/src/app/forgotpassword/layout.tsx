import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

// The forgot-password page is a client component, so this layout carries its
// SEO/social metadata. The page itself (entering an email) is public.
export const metadata: Metadata = pageMetadata({
  title: "Forgot Password",
  description:
    "Reset your BloggerSpace account password. Enter your email to receive a verification code and set a new password.",
  path: "/forgotpassword",
  keywords: ["bloggerspace forgot password", "reset password", "account recovery", "password reset"],
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

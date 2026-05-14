import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join BloggerSpace — write thoughtful articles, get reviewed by humans, and build your readership.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

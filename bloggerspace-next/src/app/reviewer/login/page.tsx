"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Reviewer accounts are now regular users — log in via the standard /login page.
export default function ReviewerLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}

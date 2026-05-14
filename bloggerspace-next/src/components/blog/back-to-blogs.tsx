"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackToBlogs() {
  const router = useRouter();

  const handleBack = () => {
    // Go back in browser history — preserves ?page=X&category=... params
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/blogs");
    }
  };

  return (
    <button
      onClick={handleBack}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="size-4" />
      Back to blogs
    </button>
  );
}

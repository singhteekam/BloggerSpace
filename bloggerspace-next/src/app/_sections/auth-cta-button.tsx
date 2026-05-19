"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface AuthCtaButtonProps {
  label: string;
  size?: "sm" | "lg" | "default";
  variant?: "default" | "outline";
  className?: string;
  arrowClassName?: string;
}

export function AuthCtaButton({
  label,
  size = "default",
  variant = "default",
  className,
  arrowClassName,
}: AuthCtaButtonProps) {
  const { user } = useAuth();
  const href = user ? "/newblog" : "/signup";

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={href}>
        {label}
        <ArrowRight className={arrowClassName ?? "size-4"} />
      </Link>
    </Button>
  );
}

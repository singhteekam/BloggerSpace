import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/lib/constants/site";

type LogoVariant = "mark" | "wordmark" | "lockup";

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
  size?: number;
};

export function Logo({ variant = "lockup", className, size = 32 }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {variant !== "wordmark" && (
        <Image
          src="/brand/logo128x128.png"
          alt={`${siteConfig.name} logo`}
          width={size}
          height={size}
          className="shrink-0"
          priority
        />
      )}
      {variant !== "mark" && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.05em] font-semibold tracking-tight text-foreground">
            {siteConfig.name}
          </span>
          <span className="text-[0.6em] font-normal tracking-wide text-muted-foreground">
            by Teekam Singh
          </span>
        </span>
      )}
    </span>
  );
}

import { cn } from "@/lib/utils/cn";

type AnimatedGradientProps = {
  className?: string;
};

export function AnimatedGradient({ className }: AnimatedGradientProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 bg-brand-gradient", className)}
    />
  );
}

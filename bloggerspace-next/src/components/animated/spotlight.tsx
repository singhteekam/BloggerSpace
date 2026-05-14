"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SpotlightProps = {
  children: ReactNode;
  className?: string;
  size?: number;
  intensity?: number;
};

/**
 * Soft radial spotlight that follows the cursor inside the wrapper.
 * Fades in on hover. Add as a positioned wrapper around card-like content.
 */
export function Spotlight({
  children,
  className,
  size = 320,
  intensity = 0.18,
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 22, stiffness: 280 });
  const sy = useSpring(y, { damping: 22, stiffness: 280 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn("group relative overflow-hidden", className)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, var(--primary) ${intensity * 100}%, transparent), transparent 60%)`,
          width: size,
          height: size,
          left: 0,
          top: 0,
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

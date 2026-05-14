"use client";

import { motion, useAnimationControls } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  /** false = right-to-left (default). true = left-to-right. */
  reverse?: boolean;
  duration?: number;
};

/**
 * Infinite horizontal marquee.
 *
 * The animated div renders children TWICE so both copies are side-by-side.
 * Total div width = 2 × content_width.
 * Translating by ±50% of that equals exactly ±content_width → seamless loop.
 *
 *  RTL: x  0%  →  -50%  (content streams right → left)
 *  LTR: x -50% →   0%   (content streams left → right)
 */
export function Marquee({
  children,
  className,
  reverse = false,
  duration = 40,
}: MarqueeProps) {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      x: reverse ? ["-50%", "0%"] : ["0%", "-50%"],
      transition: { duration, ease: "linear", repeat: Infinity, repeatType: "loop" },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reverse, duration]);

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden",
        "mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className,
      )}
    >
      <motion.div
        className="flex shrink-0 items-center"
        animate={controls}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </motion.div>
    </div>
  );
}

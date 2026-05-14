"use client";

import { motion, useInView, type HTMLMotionProps } from "motion/react";
import { useRef, type ReactNode } from "react";

type ScrollRevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  amount?: number;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
};

/**
 * Reveals on scroll using IntersectionObserver. Defaults to "play once".
 * Use for sections beyond the fold so motion isn't wasted on hidden content.
 */
export function ScrollReveal({
  children,
  amount = 0.25,
  delay = 0,
  duration = 0.6,
  y = 20,
  once = true,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount, once });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

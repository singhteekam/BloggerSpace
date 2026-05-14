"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";

type FadeInProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
};

/**
 * Fade-and-slide-up wrapper. Plays once on mount.
 * Use for hero copy, section headers, and any "first paint" reveal.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.55,
  y = 12,
  once = true,
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={once ? { once: true } : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

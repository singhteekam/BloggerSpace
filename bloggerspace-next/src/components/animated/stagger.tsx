"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";

type StaggerProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  stagger?: number;
};

/**
 * Wrap a list to stagger entry animations of its children.
 * Children should be wrapped in <StaggerItem/>.
 */
export function Stagger({ children, delay = 0, stagger = 0.08, ...rest }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  y?: number;
};

export function StaggerItem({ children, y = 10, ...rest }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";

type Direction = "left" | "right" | "up" | "down";

type SlideInProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  direction?: Direction;
  distance?: number;
  delay?: number;
  duration?: number;
};

const offsetFor = (direction: Direction, distance: number) => {
  switch (direction) {
    case "left":
      return { x: -distance, y: 0 };
    case "right":
      return { x: distance, y: 0 };
    case "up":
      return { x: 0, y: -distance };
    case "down":
    default:
      return { x: 0, y: distance };
  }
};

export function SlideIn({
  children,
  direction = "down",
  distance = 24,
  delay = 0,
  duration = 0.55,
  ...rest
}: SlideInProps) {
  const offset = offsetFor(direction, distance);
  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { motion, useScroll } from "motion/react";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-primary"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

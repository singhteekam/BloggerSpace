"use client";

import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "motion/react";
import { useRef, type MouseEvent, type ReactNode } from "react";

type MagneticButtonProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  strength?: number;
};

/**
 * Pointer-tracking "magnetic" wrapper. Pull strength scales with how close
 * the cursor is to the element center. Wraps any clickable element.
 */
export function MagneticButton({
  children,
  strength = 0.3,
  className,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 18, stiffness: 220, mass: 0.6 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

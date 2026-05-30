"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export function ProtectedImage({ src, alt, fill, width, height, sizes, className, priority }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

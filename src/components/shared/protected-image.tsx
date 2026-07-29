"use client";

import Image from "next/image";

/**
 * Watermarked preview image with the easy save paths removed: no drag, no
 * context menu, no long-press save sheet, and an invisible overlay so a plain
 * tap-and-hold grabs nothing. Determined users can still screenshot — the real
 * protection is the watermark and the low-resolution render.
 */
export function ProtectedImage({
  src,
  alt,
  width,
  height,
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <div className={`relative select-none ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        className="pointer-events-none w-full select-none"
        style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
      />
      {/* transparent shield: swallows long-press / right-click on mobile */}
      <div
        aria-hidden
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0"
        style={{ WebkitTouchCallout: "none" }}
      />
    </div>
  );
}

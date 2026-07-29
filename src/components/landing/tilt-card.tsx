"use client";

import { useRef, useState } from "react";

/**
 * Subtle 3D tilt that follows the pointer, like holding a printed card up to
 * the light. Kept to a few degrees on purpose — anything stronger stops feeling
 * like a physical object and starts feeling like a toy.
 *
 * Pointer-driven only: touch devices get the plain card, and the transform is
 * dropped entirely under `prefers-reduced-motion`.
 */
const MAX_TILT_DEG = 7;

export function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // -0.5 … 0.5 from the centre of the card.
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * MAX_TILT_DEG * 2, y: px * MAX_TILT_DEG * 2 });
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt(null)}
      className={className}
      style={{ perspective: "1000px" }}
    >
      <div
        style={{
          transform: tilt
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : "rotateX(0deg) rotateY(0deg)",
          transformStyle: "preserve-3d",
          transition: tilt ? "transform 120ms ease-out" : "transform 500ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

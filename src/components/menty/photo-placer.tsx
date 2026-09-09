"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Maximize2, RotateCcw, ZoomIn } from "lucide-react";
import type { MentyProduct, PrintArea } from "@/lib/shop/products";

import {
  DEFAULT_PLACEMENT,
  MIN_PRINT_DPI,
  type Placement,
} from "@/lib/shop/placement";

export { DEFAULT_PLACEMENT, type Placement };

export function PhotoPlacer({
  product,
  photoUrl,
  placement,
  onChange,
}: {
  product: MentyProduct;
  /** Signed URL of the uploaded photo. */
  photoUrl: string;
  placement: Placement;
  onChange: (p: Placement) => void;
}) {
  const area = product.printArea;
  const frameRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const dragging = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null
  );

  const move = useCallback(
    (dxFraction: number, dyFraction: number) => {
      onChange({
        ...placement,
        // Clamped so the photo can never be dragged out of the window and
        // leave a blank corner in the print.
        x: clamp(dxFraction, 0, 1),
        y: clamp(dyFraction, 0, 1),
      });
    },
    [onChange, placement]
  );

  useEffect(() => {
    function onUp() {
      dragging.current = null;
    }
    function onMove(e: PointerEvent) {
      const d = dragging.current;
      const frame = frameRef.current;
      if (!d || !frame) return;
      const rect = frame.getBoundingClientRect();
      move(
        d.ox + (e.clientX - d.px) / rect.width,
        d.oy + (e.clientY - d.py) / rect.height
      );
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [move]);

  if (!area) return null;

  const dpi = natural ? effectiveDpi(natural, area, placement.scale) : null;
  const lowRes = dpi !== null && dpi < MIN_PRINT_DPI;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Намести снимката</p>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PLACEMENT)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" strokeWidth={1.5} /> Центрирай
        </button>
      </div>

      {/* The product photograph, with the print window cut into it. Everything
          outside the window is dimmed, so what will actually be printed is
          unmistakable. */}
      <div className="relative mt-2.5 aspect-square w-full overflow-hidden rounded-xl bg-sand ring-1 ring-border">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="480px"
            className="object-cover"
            priority
          />
        )}

        <div
          ref={frameRef}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            dragging.current = {
              px: e.clientX,
              py: e.clientY,
              ox: placement.x,
              oy: placement.y,
            };
          }}
          style={{
            left: `${area.x * 100}%`,
            top: `${area.y * 100}%`,
            width: `${area.width * 100}%`,
            height: `${area.height * 100}%`,
          }}
          className="absolute cursor-grab overflow-hidden outline outline-2 outline-offset-2 outline-forest/70 active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Твоята снимка върху продукта"
            draggable={false}
            onLoad={(e) =>
              setNatural({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
            }
            style={{
              transform: `translate(-50%, -50%) scale(${placement.scale})`,
              left: `${placement.x * 100}%`,
              top: `${placement.y * 100}%`,
            }}
            className="pointer-events-none absolute min-h-full min-w-full max-w-none object-cover"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ZoomIn className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={placement.scale}
          onChange={(e) => onChange({ ...placement, scale: Number(e.target.value) })}
          aria-label="Мащаб на снимката"
          className="h-1 w-full flex-1 cursor-pointer appearance-none rounded-full bg-border accent-forest"
        />
        <Maximize2 className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Плъзни снимката, за да я наместиш. Отпечатва се само това, което е в
        рамката — {area.widthMm} × {area.heightMm} мм.
      </p>

      {/* A photo can look perfect on screen and still be 80 DPI once it is
          90mm wide on a mug. Saying so before the order beats apologising
          after the print. */}
      {lowRes && (
        <p className="mt-2 rounded-lg bg-clay/10 p-3 text-xs text-clay">
          Снимката е с ниска резолюция за този размер (около {dpi} DPI). Ще се
          отпечата, но детайлите ще са меки — по-голяма снимка или по-малко
          увеличение ще дадат по-добър резултат.
        </p>
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Roughly what resolution the print will have.
 *
 * The photo is scaled to cover the print window, so the limiting dimension is
 * whichever side of the photo is proportionally smaller. Zooming in uses fewer
 * of the photo's pixels across the same millimetres, so DPI falls as `scale`
 * rises.
 */
function effectiveDpi(
  natural: { w: number; h: number },
  area: PrintArea,
  scale: number
): number {
  const areaRatio = area.widthMm / area.heightMm;
  const photoRatio = natural.w / natural.h;
  // Pixels of the photo that end up spanning the print window's width.
  const pxAcross =
    photoRatio > areaRatio ? (natural.h * areaRatio) / scale : natural.w / scale;
  const inches = area.widthMm / 25.4;
  return Math.round(pxAcross / inches);
}

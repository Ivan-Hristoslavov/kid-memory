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
import { frontMockup } from "@/lib/pod/mockups";

export { DEFAULT_PLACEMENT, type Placement };

export function PhotoPlacer({
  product,
  photoUrl,
  placement,
  onChange,
  colorHex,
}: {
  product: MentyProduct;
  /** Signed URL of the uploaded photo. */
  photoUrl: string;
  placement: Placement;
  onChange: (p: Placement) => void;
  /** The chosen colour, painted behind the mock-up. */
  colorHex?: string;
}) {
  const area = product.printArea;
  /**
   * The supplier's flat render of this blank, or nothing.
   *
   * When there is one, the preview is built the way their own editor builds it
   * — a solid colour, the artwork, then the greyscale PNG over the top — and
   * `printArea` lines up with it exactly, because both came from the same
   * layout. When there is not (stickers, our own poster), the product photo is
   * the backdrop and the window is drawn on it as before.
   */
  const mock = frontMockup(product.supplierProductCode);
  const frameRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const dragging = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null
  );

  /**
   * How the photo is fitted, and how far past the window it then reaches.
   *
   * The mock-ups are square, so the window's on-screen aspect is just the print
   * area's own width/height fractions. Whichever side of the photo is
   * proportionally shorter is pinned to the window; the other overflows, and
   * that overflow is what there is to pan.
   *
   * Computed before the callbacks because the pan clamp depends on it, and
   * hooks cannot run after the `!area` early return below.
   */
  const frameAspect = mock?.aspect ?? 1;
  const cover = coverOf(natural, product.printArea, placement.scale, frameAspect);

  const move = useCallback(
    (nextX: number, nextY: number) => {
      onChange({
        ...placement,
        // Clamped against the ACTUAL overflow so no blank edge can enter the
        // print. A flat 0..1 was wrong: at x = 0 the photo's centre sits on the
        // window's left edge, leaving the right half empty.
        x: clamp(nextX, ...panRange(cover.rx)),
        y: clamp(nextY, ...panRange(cover.ry)),
      });
    },
    [onChange, placement, cover.rx, cover.ry]
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

      {/* The try-on.
          Colour, then artwork, then the supplier's greyscale render on top —
          the same order their editor uses, which is why the print looks like it
          is ON the cloth and why anything spilling past the garment is masked
          by the render's own opaque surround. */}
      <div
        className="relative mt-2.5 w-full overflow-hidden rounded-xl ring-1 ring-border"
        style={{
          aspectRatio: mock ? String(mock.aspect) : "1",
          backgroundColor: mock ? (colorHex ?? "#E8E8E8") : undefined,
        }}
      >
        {!mock && product.images[0] && (
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
          className="absolute cursor-grab overflow-hidden active:cursor-grabbing"
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
              // Sized to COVER the window, then scaled. Previously this had no
              // width or height at all, only `min-w-full min-h-full`, so the
              // photo rendered at its natural size — a 1536px image inside a
              // 200px window, which is why scale 1 looked like a 700% zoom.
              ...(cover.axis === "width"
                ? { width: "100%", height: "auto" }
                : { width: "auto", height: "100%" }),
              transform: `translate(-50%, -50%) scale(${placement.scale})`,
              left: `${placement.x * 100}%`,
              top: `${placement.y * 100}%`,
            }}
            className="pointer-events-none absolute max-w-none"
          />
        </div>

        {mock && (
          <Image
            src={mock.image}
            alt={product.title}
            fill
            sizes="480px"
            // Above the artwork on purpose: this PNG is only folds and shadow
            // over the garment, and opaque everywhere else.
            className="pointer-events-none object-contain"
            priority
          />
        )}

        {/* The window marker sits above the render, or it would be under the
            garment's own shading and invisible. */}
        <div
          aria-hidden
          style={{
            left: `${area.x * 100}%`,
            top: `${area.y * 100}%`,
            width: `${area.width * 100}%`,
            height: `${area.height * 100}%`,
          }}
          className="pointer-events-none absolute rounded-[2px] outline-dashed outline-2 outline-offset-2 outline-forest/45"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ZoomIn className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={placement.scale}
          onChange={(e) => {
            // Zooming OUT shrinks the pannable range, so a position that was
            // legal at 2x can leave a blank edge at 1.2x. Re-clamp against the
            // new range rather than only on drag.
            const scale = Number(e.target.value);
            const next = coverOf(natural, area, scale, frameAspect);
            onChange({
              scale,
              x: clamp(placement.x, ...panRange(next.rx)),
              y: clamp(placement.y, ...panRange(next.ry)),
            });
          }}
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
 * How far the photo's centre may travel and still cover the window.
 *
 * With the photo `r` times the window's width, it spans [x - r/2, x + r/2] in
 * window units. Covering means x - r/2 <= 0 and x + r/2 >= 1, so the centre
 * lives in [1 - r/2, r/2]. At r = 1 that collapses to exactly 0.5 — nothing to
 * pan, which is correct, because at that size the photo fits precisely.
 */
function panRange(r: number): [number, number] {
  if (r <= 1) return [0.5, 0.5];
  return [1 - r / 2, r / 2];
}

/** Which side is pinned to the window, and the overflow on each axis. */
function coverOf(
  natural: { w: number; h: number } | null,
  area: PrintArea | undefined,
  scale: number,
  frameAspect: number
): { axis: "width" | "height"; rx: number; ry: number } {
  if (!natural || !area) return { axis: "width", rx: scale, ry: scale };
  // The window's fractions are of the frame, and the frame is not square — a
  // t-shirt render is 458x410. Assuming square here put the pinned side on the
  // wrong axis and let a blank edge into the print.
  const windowAspect = (area.width / area.height) * frameAspect;
  const photoAspect = natural.w / natural.h;
  return photoAspect > windowAspect
    ? { axis: "height", rx: (photoAspect / windowAspect) * scale, ry: scale }
    : { axis: "width", rx: scale, ry: (windowAspect / photoAspect) * scale };
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

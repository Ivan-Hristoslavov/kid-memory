"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Maximize2, RotateCcw, ZoomIn } from "lucide-react";
import type { MentyProduct, PrintArea } from "@/lib/shop/products";

import {
  DEFAULT_PLACEMENT,
  MIN_PRINT_DPI,
  TEXT_FONTS,
  type Placement,
  type TextFont,
} from "@/lib/shop/placement";
import { mockupsFor } from "@/lib/pod/mockups";
import { printAreaMm } from "@/lib/pod/catalog";

export { DEFAULT_PLACEMENT, type Placement };

export function PhotoPlacer({
  product,
  photoUrl,
  placement,
  onChange,
  colorHex,
  text,
  isDesign = false,
  artwork,
}: {
  product: MentyProduct;
  /** The artwork: a signed URL of an upload, or a ready-made design's file. */
  photoUrl?: string;
  placement: Placement;
  onChange: (p: Placement) => void;
  /** The chosen colour, painted behind the mock-up. */
  colorHex?: string;
  /**
   * The customer's line, shown where it will actually be printed.
   *
   * Typing into a box and being told the result will be fine is not a preview.
   * It is also the cheapest guard against disappointment: a name that overflows
   * the print area is visible here rather than at the door.
   */
  text?: string;
  /**
   * Whether the artwork is a ready-made design rather than a photograph.
   *
   * It changes how the artwork is fitted, and that difference matters. A photo
   * COVERS the print window — a gap at the edge of a printed photograph looks
   * like a mistake. A design CONTAINS — it is drawn on transparency with its
   * own margins, and cropping a crest to fill a rectangle cuts the crest.
   *
   * It also turns off the resolution warning, which measures a photograph's
   * pixels against millimetres and has nothing to say about flat artwork.
   */
  isDesign?: boolean;
  /**
   * Artwork rendered as markup rather than fetched as a file — a text design.
   *
   * Takes precedence over `photoUrl`. It exists because lettering has to be
   * live: it is set from the customer's own name, and an SVG that reaches the
   * page's webfonts has to be in the page, not behind an <img>.
   */
  artwork?: React.ReactNode;
}) {
  const catalogueArea = product.printArea;
  /**
   * The supplier's flat render of this blank, or nothing.
   *
   * When there is one, the preview is built the way their own editor builds it
   * — a solid colour, the artwork, then the greyscale PNG over the top — and
   * `printArea` lines up with it exactly, because both came from the same
   * layout. When there is not (stickers, our own poster), the product photo is
   * the backdrop and the window is drawn on it as before.
   */
  const views = mockupsFor(product.supplierProductCode);
  const [view, setView] = useState(0);
  const mock = views[view];

  /**
   * The print window for the view being shown.
   *
   * It has to come from the mock-up, not from the catalogue. `printArea` is one
   * rectangle per product — the front — and drawing it over the left-hand view
   * of a mug put the print through the handle. The catalogue's copy stays as
   * the fallback for products with no mock-up at all, and as the source of the
   * millimetres the resolution warning needs.
   */
  const area =
    mock && catalogueArea
      ? {
          ...catalogueArea,
          ...mock.print,
          // Millimetres per view too, or the resolution warning would judge a
          // mug's narrow side panel by the front wrap's dimensions.
          ...(printAreaMm(product.supplierProductCode ?? "", mock.name) ?? {}),
        }
      : catalogueArea;
  const frameRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

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

  // Plain function, not useCallback: the React Compiler memoizes this for us,
  // and the hand-written version spread `placement` in a way it could not
  // preserve — which turned off optimisation for the whole component.
  function move(nextX: number, nextY: number) {
    onChange({
      ...placement,
      // Clamped against the ACTUAL overflow so no blank edge can enter the
      // print. A flat 0..1 was wrong: at x = 0 the photo's centre sits on the
      // window's left edge, leaving the right half empty.
      x: clamp(nextX, ...panRange(cover.rx)),
      y: clamp(nextY, ...panRange(cover.ry)),
    });
  }

  /**
   * Starts a drag, and wires the listeners for its lifetime.
   *
   * Attached here rather than in an effect. An effect would either re-subscribe
   * on every render, or read `move` through a ref during render, which the
   * React Compiler rejects — and neither buys anything, because the listeners
   * are only wanted while a pointer is actually down.
   */
  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const from = {
      px: e.clientX,
      py: e.clientY,
      ox: placement.x,
      oy: placement.y,
    };
    const frame = frameRef.current;
    if (!frame) return;

    function onMove(ev: PointerEvent) {
      const rect = frame!.getBoundingClientRect();
      move(
        from.ox + (ev.clientX - from.px) / rect.width,
        from.oy + (ev.clientY - from.py) / rect.height
      );
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  if (!area) return null;

  const dpi = natural ? effectiveDpi(natural, area, placement.scale) : null;
  const lowRes = !isDesign && dpi !== null && dpi < MIN_PRINT_DPI;


  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {!photoUrl && !artwork
            ? "Ето как ще изглежда"
            : isDesign
              ? "Намести дизайна"
              : "Намести снимката"}
        </p>
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
      {/* The stage is WHITE, and that is not a style choice.
          Every mock-up is opaque white outside the garment — that surround is
          what masks the colour behind it. Set the stage in sand and the
          surround becomes a hard white rectangle sitting inside a cream box,
          which is what this looked like: a screenshot pasted onto the page.
          Matching the surround makes it disappear and the garment float.

          Two boxes still, because the inner one has to stay a flat rectangle of
          the chosen colour — composite the mock-up's shading over a gradient
          and the shirt comes out dirty. */}
      <div className="relative mt-2.5 overflow-hidden rounded-xl bg-white p-3 ring-1 ring-border sm:p-5">
        <div
          className="relative mx-auto w-full drop-shadow-[0_10px_24px_rgba(31,47,40,0.10)]"
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
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
            priority
          />
        )}

        {mock?.overlay && (
          <Image
            src={mock.image}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            // This one is an ordinary opaque photograph — a mug, an enamel cup,
            // a tracksuit. Artwork goes over it, or it goes behind a wall.
            className="pointer-events-none object-contain"
            priority
          />
        )}

        {view === 0 && <div
          ref={frameRef}
          onPointerDown={startDrag}
          style={{
            left: `${area.x * 100}%`,
            top: `${area.y * 100}%`,
            width: `${area.width * 100}%`,
            height: `${area.height * 100}%`,
          }}
          // A container so the text can be sized in cqw. Percentage font-size
          // resolves against the PARENT's font-size, not the box, which set the
          // line at 6px — technically rendered, practically invisible.
          className="absolute cursor-grab overflow-hidden [container-type:inline-size] active:cursor-grabbing"
        >
          {artwork && (
            <div className="pointer-events-none absolute inset-0">{artwork}</div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          {!artwork && photoUrl && <img
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
              ...(isDesign
                ? { width: "100%", height: "100%", objectFit: "contain" as const }
                : cover.axis === "width"
                  ? { width: "100%", height: "auto" }
                  : { width: "auto", height: "100%" }),
              transform: `translate(-50%, -50%) scale(${placement.scale})`,
              left: `${placement.x * 100}%`,
              top: `${placement.y * 100}%`,
              // The fade is a mask, not a border: the image simply stops
              // carrying ink towards its edge, which is what the print does
              // too. Applied on both axes so a corner fades like a side.
              ...(placement.feather > 0
                ? {
                    WebkitMaskImage: featherMask(placement.feather),
                    maskImage: featherMask(placement.feather),
                    WebkitMaskComposite: "source-in",
                    maskComposite: "intersect",
                  }
                : null),
            }}
            className="pointer-events-none absolute max-w-none"
          />}

          {text && !artwork && (
            <span
              style={{
                fontFamily: TEXT_FONTS[placement.font].css,
                // Sized against the print window itself, so one line looks
                // right on a mug's narrow band and a hoodie's wide chest.
                fontSize: "13cqw",
                lineHeight: 1.15,
                // Ink that would vanish is not a preview. A pale garment gets
                // dark type and a dark one gets ivory, which is also the choice
                // a printer would make.
                color: isLight(colorHex) ? "#2B2B2B" : "#FEFCF8",
              }}
              className="pointer-events-none absolute inset-x-[6%] bottom-[6%] text-center font-semibold [overflow-wrap:anywhere]"
            >
              {text}
            </span>
          )}
        </div>}

        {mock && !mock.overlay && (
          <Image
            src={mock.image}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            // Above the artwork on purpose: this PNG is only folds and shadow
            // over the garment, and opaque everywhere else.
            className="pointer-events-none object-contain"
            priority
          />
        )}

        {/* The window marker sits above the render, or it would be under the
            garment's own shading and invisible. */}
        {view === 0 && (photoUrl || artwork) && (
          <div
            aria-hidden
            style={{
              left: `${area.x * 100}%`,
              top: `${area.y * 100}%`,
              width: `${area.width * 100}%`,
              height: `${area.height * 100}%`,
            }}
            className="pointer-events-none absolute rounded-[2px] outline-dashed outline-2 outline-offset-2 outline-forest/40"
          />
        )}
        </div>
      </div>

      {/* Turn the product round.
          The supplier renders every angle they print on, so there is no reason
          to show one. The design stays on the front because that is the one
          print position an order carries today — a second position is another
          3.08 to produce and needs a price rule before it can be offered. */}
      {views.length > 1 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {views.map((v, i) => (
            <button
              key={v.name + i}
              type="button"
              onClick={() => setView(i)}
              aria-pressed={view === i}
              className={`h-8 rounded-lg border px-3 text-xs font-medium transition-colors ${
                view === i
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground/70 hover:border-foreground/40"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {text && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground">Шрифт</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(TEXT_FONTS) as TextFont[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChange({ ...placement, font: f })}
                aria-pressed={placement.font === f}
                style={{ fontFamily: TEXT_FONTS[f].css }}
                className={`h-9 rounded-lg border px-3 text-sm transition-colors ${
                  placement.font === f
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground/80 hover:border-foreground/40"
                }`}
              >
                {TEXT_FONTS[f].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {photoUrl && !isDesign && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-semibold text-foreground">Меки ръбове</p>
            <p className="text-xs text-muted-foreground">
              {placement.feather === 0 ? "Изключено" : `${Math.round(placement.feather * 200)}%`}
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={placement.feather}
            onChange={(e) =>
              onChange({ ...placement, feather: Number(e.target.value) })
            }
            aria-label="Меки ръбове на снимката"
            className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-forest"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Разтваря снимката в плата, вместо да я отрязва с ръб.
          </p>
        </div>
      )}

      {photoUrl && (
        <>
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
                ...placement,
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
        </>
      )}
    </div>
  );
}

/**
 * A soft edge on all four sides, as two crossed linear gradients.
 *
 * A radial mask would be the obvious choice and is the wrong one: it fades the
 * corners of a landscape photo long before its sides, so a group shot loses the
 * people at the ends. Two linear masks intersected fade each edge by the same
 * amount whatever the aspect.
 */
function featherMask(feather: number): string {
  const pct = Math.round(feather * 100);
  const stop = `transparent 0, #000 ${pct}%, #000 ${100 - pct}%, transparent 100%`;
  return `linear-gradient(to right, ${stop}), linear-gradient(to bottom, ${stop})`;
}

/**
 * Whether a garment colour is light enough to need dark type on it.
 *
 * Rec. 709 luma rather than a plain average: the eye reads green as far
 * brighter than blue, so averaging calls a saturated blue "light" and puts
 * charcoal text on navy.
 */
function isLight(hex: string | undefined): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const n = parseInt(hex.slice(1), 16);
  const luma =
    0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return luma > 140;
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

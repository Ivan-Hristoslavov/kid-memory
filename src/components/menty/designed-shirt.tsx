import Image from "next/image";
import { frontMockup } from "@/lib/pod/mockups";
import { textDesignById } from "@/lib/shop/text-designs";
import { baseUidForDesign, readyArtwork } from "@/lib/shop/ready";
import { TextDesignArt } from "./text-design-art";

/**
 * A finished shirt: colour, artwork, and the supplier's render over the top.
 *
 * The same three layers the try-on uses, and for the same reason — the artwork
 * sits UNDER the greyscale render so the fabric's shading falls across it, and
 * the render's opaque surround masks anything that overflows the garment.
 *
 * This is what makes a hundred and sixty ready-made shirts free. Every card,
 * every gallery and every basket thumbnail composites live, so no picture has
 * to be generated, stored, or regenerated when a mock-up is replaced. The
 * lettering is the strongest case: it is set from the design AND the buyer's
 * name, so no pre-rendered file could have been right anyway.
 */
export function DesignedShirt({
  designId,
  colorHex,
  name = "",
  uid,
  priority = false,
}: {
  designId: string;
  /** The garment colour. Everything else is composited over it. */
  colorHex: string;
  /** Fills a `{name}` slot in a lettering design. */
  name?: string;
  /**
   * Supplier blank whose mock-up to use.
   *
   * Defaults to whatever the design is sold on, so a hen design is drawn on the
   * women's cut everywhere without any caller having to know that. Passed
   * explicitly only when a page is showing a design on a specific garment.
   */
  uid?: string;
  priority?: boolean;
}) {
  const mock = frontMockup(uid ?? baseUidForDesign(designId));
  if (!mock) return null;

  const text = textDesignById(designId);
  const artwork = text ? null : readyArtwork(designId);
  const light = !isLight(colorHex);

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: String(mock.aspect), backgroundColor: colorHex }}
    >
      <div
        className="absolute"
        style={{
          left: `${mock.print.x * 100}%`,
          top: `${mock.print.y * 100}%`,
          width: `${mock.print.width * 100}%`,
          height: `${mock.print.height * 100}%`,
        }}
      >
        {text ? (
          <TextDesignArt
            design={text}
            name={name}
            color={light ? "#FEFCF8" : "#2B2B2B"}
          />
        ) : (
          artwork && (
            <Image
              src={artwork}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 400px"
              className="object-contain"
            />
          )
        )}
      </div>

      <Image
        src={mock.image}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 560px"
        className="pointer-events-none object-contain"
        priority={priority}
      />
    </div>
  );
}

/** Rec. 709 luma — a saturated blue is not a light garment. */
function isLight(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255) >
    140
  );
}

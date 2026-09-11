import { BRAND } from "@/lib/brand";

/**
 * The MENTY mark.
 *
 * Live text plus a drawn heart rather than an image file. The identity sheet
 * specifies five lockups — primary light, primary dark, icon, stacked and
 * wordmark-only — which are the same two shapes recoloured and rearranged; as a
 * bitmap that would be five assets that drift apart, and none of them would
 * take `currentColor` or stay sharp on a retina header.
 *
 * The heart is the brand's actual mark, so it is drawn here as a path instead
 * of borrowed from an icon set: a generic heart glyph sits on a different
 * baseline and has a different shoulder curve, and the difference is obvious
 * beside the printed packaging.
 */
function Heart({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 22"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12 21.3 2.9 12.2A6.1 6.1 0 0 1 12 4.3a6.1 6.1 0 0 1 9.1 7.9L12 21.3Z" />
    </svg>
  );
}

/**
 * `tone` picks the lockup rather than a colour, so a caller never hardcodes the
 * palette: "ink" is the mark on a light ground, "inverse" on a dark one.
 */
export function Logo({
  tone = "ink",
  showTagline = false,
  className = "",
}: {
  tone?: "ink" | "inverse";
  /** The strapline under the wordmark. Off in the header, on in the footer. */
  showTagline?: boolean;
  className?: string;
}) {
  const word = tone === "inverse" ? "text-ivory" : "text-forest";

  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="inline-flex items-start gap-[0.12em]">
        {/* The wordmark is set in the heading face, not a third family.
            It used to be Nunito while the navigation beside it is Manrope and
            the headlines are Playfair — three families on one screen, and the
            two sans faces close enough that the difference read as a mistake
            rather than a decision. "Almost the same" is the worst of the three
            options; this takes the other one, and ties the mark to the H1 it
            sits above.

            Nunito stays loaded for the printed designs, where a rounded sans is
            one of the three faces a customer can choose. It is simply not the
            logo any more. */}
        <span
          className={`font-heading text-[1.55em] font-extrabold tracking-[-0.015em] ${word}`}
        >
          {BRAND.name}
        </span>
        {/* Raised to cap height and sized against the wordmark, so the pair
            scales as one object from a favicon to a shop sign. */}
        <Heart className="mt-[0.18em] size-[0.5em] shrink-0 text-blush" />
      </span>
      {showTagline && (
        <span
          className={`mt-[0.5em] text-[0.62em] font-semibold uppercase tracking-[0.28em] ${
            tone === "inverse" ? "text-ivory/70" : "text-forest/60"
          }`}
        >
          {BRAND.taglineEn}
        </span>
      )}
    </span>
  );
}

/** The square icon lockup — an M and the heart. For the favicon and the app. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-start gap-[0.06em] ${className}`}>
      {/* The same face as the full wordmark, or the icon and the logo would be
          two different brands wearing the same name. */}
      <span className="font-heading text-[1.5em] font-extrabold leading-none text-forest">
        M
      </span>
      <Heart className="mt-[0.16em] size-[0.42em] shrink-0 text-blush" />
    </span>
  );
}

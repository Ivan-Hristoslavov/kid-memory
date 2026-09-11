import Image from "next/image";
import Link from "next/link";
import { DESIGNS, designImage } from "@/lib/shop/designs";

/**
 * A taste of the ready-made designs, on the homepage.
 *
 * The eight are hand-picked rather than "the first eight": one strip has to
 * show that the range covers a stag weekend AND a dog AND a raid night, because
 * a visitor decides whether this shop has anything for them from one row.
 *
 * Every tile links to the design index rather than straight into a product.
 * From the homepage the useful next thought is "what else is there", not "buy
 * this exact crest".
 */
const FEATURED = [
  "raid-party",
  "stag-crown",
  "hen-wreath",
  "pixel-heart",
  "dog-line",
  "barbell",
  "mountain-sun",
  "coffee-first",
];

export function DesignStrip() {
  const designs = FEATURED.map((id) => DESIGNS.find((d) => d.id === id)).filter(
    (d) => d !== undefined
  );

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Нямаш снимка? Няма нужда.
            </h2>
            <p className="mt-1.5 text-base text-muted-foreground">
              {DESIGNS.length} готови дизайна — избираш и го носиш.
            </p>
          </div>
          <Link
            href="/dizaini"
            className="shrink-0 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
          >
            Виж всички →
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-4 gap-3 sm:gap-4 lg:grid-cols-8">
          {designs.map((d) => (
            <li key={d.id}>
              <Link
                href="/dizaini"
                title={d.title}
                className={`group block aspect-square overflow-hidden rounded-xl ring-1 ring-border ${
                  d.forDark ? "bg-ground-dark" : "bg-ground-light"
                }`}
              >
                <div className="relative size-full">
                  <Image
                    src={designImage(d.id)}
                    alt={d.title}
                    fill
                    sizes="(max-width: 640px) 25vw, 160px"
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

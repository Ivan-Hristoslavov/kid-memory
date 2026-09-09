import Image from "next/image";
import Link from "next/link";
import { GIFT_OCCASIONS } from "@/lib/brand";

/**
 * The occasion tiles — six photographs with the label set over the image, as
 * in the reference. A gradient scrim rather than a flat overlay, so the label
 * stays legible on a bright photograph without dulling the whole tile.
 */
export function Occasions() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            За всеки повод
          </h2>
          <Link
            href="/za-povoda"
            className="shrink-0 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
          >
            Виж всички →
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {GIFT_OCCASIONS.map((o) => (
            <li key={o.id}>
              <Link
                href={`/za-povoda/${o.id}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl ring-1 ring-border"
              >
                <Image
                  src={o.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/75 to-transparent p-3 pt-10 text-sm font-semibold text-ivory">
                  {o.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

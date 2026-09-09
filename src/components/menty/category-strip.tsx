import Image from "next/image";
import Link from "next/link";
import { GIFT_AUDIENCES } from "@/lib/brand";

/**
 * The circular category rail. Eight photographs, scrollable on a phone and a
 * single row from `lg` up, matching the reference.
 *
 * People shop for a gift by recipient and by occasion long before they know
 * which object they want, so this — not the product grid — is the first thing
 * under the hero.
 */
export function CategoryStrip() {
  return (
    <section className="border-b border-border bg-background py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-7 lg:justify-between lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {GIFT_AUDIENCES.map((c) => (
            <li key={c.id} className="snap-start">
              <Link href={`/za-povoda/${c.id}`} className="group flex w-20 flex-col items-center gap-2.5 sm:w-24">
                <span className="relative block size-20 overflow-hidden rounded-full ring-1 ring-border transition-shadow group-hover:ring-foreground/25 sm:size-24">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="text-center text-xs font-medium text-foreground/85 sm:text-sm">
                  {c.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

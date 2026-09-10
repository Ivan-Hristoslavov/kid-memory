import Image from "next/image";
import Link from "next/link";
import { GIFT_THEMES } from "@/lib/brand";

/**
 * The theme rail — "what world is this gift from".
 *
 * Sits above the occasion tiles because it answers an earlier question. A
 * shopper who knows the date is already halfway to a decision; one who only
 * knows their nephew plays games needs a door, and "Гейминг" is that door.
 *
 * The door leads to the design category, not to a collection of its own. These
 * used to be their own collections, which meant "Гейминг" existed twice — once
 * here and once under /dizaini — and that duplication is most of why the site
 * stopped being navigable.
 */
export function Themes() {
  return (
    <section className="bg-sand py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Не знаеш какво да подариш?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Започни от това, което човекът обича.
            </p>
          </div>
          <Link
            href="/produkti"
            className="shrink-0 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
          >
            Всички продукти →
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {GIFT_THEMES.map((t) => (
            <li key={t.id}>
              <Link
                href={`/dizaini/${t.id}`}
                className="group block overflow-hidden rounded-xl bg-background ring-1 ring-border transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={t.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="p-3 text-center text-sm font-semibold text-foreground">
                  {t.label}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

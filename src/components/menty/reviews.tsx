import Link from "next/link";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";

/**
 * Three compact testimonials with stars, as the reference lays them out.
 *
 * The reference's own three quotes are mock-up copy and are deliberately NOT
 * reproduced. Fabricated reviews are unlawful in Bulgaria and the EU, and this
 * project has held the line from the start: the section reads admin-approved
 * rows and renders nothing at all when there are none, rather than filling the
 * space with invented praise. A missing section costs a little visual rhythm;
 * an invented one costs a great deal more.
 */
export async function Reviews() {
  const reviews = await prisma.review
    .findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
    })
    .catch(() => []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Какво казват нашите клиенти
          </h2>
          <Link
            href="/otzivi"
            className="shrink-0 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
          >
            Виж всички →
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex flex-col rounded-xl bg-sand p-6 ring-1 ring-border"
            >
              <span className="flex gap-0.5" aria-label={`${r.rating} от 5 звезди`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < r.rating
                        ? "size-4 fill-clay text-clay"
                        : "size-4 fill-border text-border"
                    }
                  />
                ))}
              </span>
              <blockquote className="mt-3 flex-1 text-pretty text-sm text-foreground/85">
                „{r.text}“
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-foreground">
                {r.authorName}
                {r.city && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {r.city}
                  </span>
                )}
              </figcaption>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

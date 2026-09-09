import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareQuote, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { Initials, Stars } from "@/components/menty/stars";
import { ReviewForm } from "@/components/reviews/review-form";

export const metadata: Metadata = {
  title: "Отзиви",
  description:
    "Прочети какво споделят клиентите ни за персонализираните подаръци и остави своя отзив.",
  alternates: { canonical: "/otzivi" },
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await prisma.review
    .findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 60,
    })
    .catch(() => []);

  const total = reviews.length;
  const avg =
    total > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : null;

  // How many gave each score. Shown as a distribution rather than a single
  // average, because "4.8 из 5" tells you nothing about whether that is
  // everyone agreeing or two extremes cancelling out.
  const buckets = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((r) => r.rating === score).length,
  }));

  const verified = reviews.filter((r) => r.orderNumber).length;

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-sand">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Какво казват клиентите
            </h1>

            {avg === null ? (
              <p className="mt-4 max-w-lg text-muted-foreground">
                Още нямаме публикувани отзиви. Публикуваме само истински — от хора,
                които наистина са поръчали.
              </p>
            ) : (
              <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12">
                <div>
                  <p className="font-heading text-5xl font-bold leading-none">{avg}</p>
                  <div className="mt-2">
                    <Stars value={avg} className="size-4" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {total} {total === 1 ? "отзив" : "отзива"}
                  </p>
                </div>

                <ul className="max-w-sm space-y-1.5">
                  {buckets.map((b) => (
                    <li key={b.score} className="flex items-center gap-3 text-xs">
                      <span className="w-3 tabular-nums text-muted-foreground">
                        {b.score}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <span
                          className="block h-full rounded-full bg-clay"
                          style={{ width: `${total ? (b.count / total) * 100 : 0}%` }}
                        />
                      </span>
                      <span className="w-6 tabular-nums text-right text-muted-foreground">
                        {b.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verified > 0 && (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-forest" strokeWidth={1.5} />
                {verified} от тях са с потвърдена поръчка
              </p>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {total === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl bg-sand py-16 text-center ring-1 ring-border">
              <MessageSquareQuote
                className="size-8 text-forest/40"
                strokeWidth={1.5}
              />
              <p className="max-w-sm text-muted-foreground">
                Бъди първият. Ако вече си поръчвал от нас, разкажи как мина.
              </p>
              <Link
                href="#formata"
                className="mt-1 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
              >
                Остави отзив
              </Link>
            </div>
          ) : (
            /* Masonry rather than a grid: reviews are wildly uneven in length,
               and equal-height cards would leave a column of white space under
               every short one. */
            <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {reviews.map((r) => (
                <li key={r.id} className="mb-5 break-inside-avoid">
                  <figure className="rounded-xl bg-card p-6 ring-1 ring-border">
                    <Stars value={r.rating} />
                    <blockquote className="mt-3 text-pretty text-sm leading-relaxed text-foreground/85">
                      „{r.text}“
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3">
                      <Initials name={r.authorName} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {r.authorName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {[r.city, r.orderNumber ? "потвърдена покупка" : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}

          <section id="formata" className="mt-16 scroll-mt-28 border-t border-border pt-12">
            <div className="max-w-xl">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Остави своя отзив
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Публикуваме го, след като го прегледаме. Номерът на поръчката е по
                желание, но с него отзивът се отбелязва като потвърдена покупка.
              </p>
              <div className="mt-6">
                <ReviewForm />
              </div>
            </div>
          </section>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

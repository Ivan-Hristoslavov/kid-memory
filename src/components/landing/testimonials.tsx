import Link from "next/link";
import { Quote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Avatar, Eyebrow, StarRating } from "./shared";

/**
 * Real, admin-approved customer reviews pulled from the DB.
 * Renders nothing until at least one review is approved — we never show
 * placeholder or invented testimonials.
 */
export async function Testimonials({ heading }: { heading?: string }) {
  const reviews = await prisma.review
    .findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
    })
    .catch(() => []);

  // Nothing to show yet — render nothing rather than an empty placeholder
  // section that signals "no customers".
  if (reviews.length === 0) return null;

  const avg =
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  return (
    <section id="reviews" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          <Eyebrow>
            <StarRating value={avg} className="size-3.5" /> {avg} / 5
          </Eyebrow>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            {heading ?? "Родители, които вече пазят спомена"}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Истински отзиви от наши клиенти.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="glass lift relative flex flex-col rounded-3xl p-7">
              <Quote className="absolute right-6 top-6 size-8 text-primary/15" />
              <StarRating value={r.rating} className="size-4" />
              <blockquote className="mt-4 flex-1 text-pretty text-foreground/85">
                „{r.text}“
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name={r.authorName} />
                <div>
                  <p className="font-heading font-bold leading-tight">{r.authorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[r.city, r.orderNumber ? "потвърдена покупка" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/otzivi">Виж всички · остави отзив</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

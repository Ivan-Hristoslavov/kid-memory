import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { ReviewForm } from "@/components/reviews/review-form";
import { Avatar, StarRating } from "@/components/landing/shared";
import { Quote } from "lucide-react";

export const metadata: Metadata = {
  title: "Отзиви от родители",
  description:
    "Прочети какво споделят родителите за персонализираните детски постери и остави своя отзив.",
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

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy flex-1 pt-10 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Отзиви от родители
            </h1>
            {avg !== null ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                <StarRating value={avg} className="size-5" />
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">{avg} / 5</span> ·{" "}
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "отзив" : "отзива"}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">
                Още нямаме публикувани отзиви — бъди първият, който сподели.
              </p>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {reviews.map((r) => (
                <figure key={r.id} className="glass relative rounded-3xl p-7">
                  <Quote className="absolute right-6 top-6 size-8 text-primary/15" />
                  <StarRating value={r.rating} className="size-4" />
                  <blockquote className="mt-4 text-pretty text-foreground/85">
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
          )}

          <div className="mt-16">
            <h2 className="mb-6 text-center font-heading text-2xl font-extrabold">
              Остави своя отзив
            </h2>
            <ReviewForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

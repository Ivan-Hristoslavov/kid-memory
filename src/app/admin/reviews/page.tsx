import type { Metadata } from "next";
import Link from "next/link";
import type { ReviewStatus } from "@prisma/client";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ReviewActions } from "@/components/admin/review-actions";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Отзиви — администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FILTERS: { id: string; label: string; status?: ReviewStatus }[] = [
  { id: "pending", label: "За одобрение", status: "PENDING" },
  { id: "approved", label: "Публикувани", status: "APPROVED" },
  { id: "rejected", label: "Отхвърлени", status: "REJECTED" },
  { id: "all", label: "Всички" },
];

const STATUS_META: Record<ReviewStatus, { label: string; cls: string }> = {
  PENDING: { label: "Чака преглед", cls: "bg-sun text-foreground" },
  APPROVED: { label: "Публикуван", cls: "bg-mint text-foreground" },
  REJECTED: { label: "Отхвърлен", cls: "bg-destructive/15 text-destructive" },
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "pending" } = await searchParams;
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];

  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({
      where: active.status ? { status: active.status } : {},
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    }),
    prisma.review.groupBy({ by: ["status"], _count: true }),
  ]);

  const countOf = (s?: ReviewStatus) =>
    s
      ? (counts.find((c) => c.status === s)?._count ?? 0)
      : counts.reduce((a, c) => a + c._count, 0);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">Отзиви</h1>
            <p className="mt-1 text-muted-foreground">
              Одобрените се показват на сайта. Останалите не се виждат никъде.
            </p>
          </div>
          <Link href="/otzivi" className="text-sm font-semibold text-primary hover:underline">
            Виж публичната страница →
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={`/admin/reviews?filter=${f.id}`}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                f.id === active.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f.label} · {countOf(f.status)}
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {reviews.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
              Няма отзиви в тази категория.
            </div>
          )}

          {reviews.map((r) => (
            <article key={r.id} className="glass rounded-3xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold">{r.authorName}</span>
                    {r.city && (
                      <span className="text-sm text-muted-foreground">· {r.city}</span>
                    )}
                    {r.orderNumber && (
                      <Badge className="rounded-full border-none bg-sky text-foreground">
                        поръчка №{r.orderNumber}
                      </Badge>
                    )}
                    {r.featured && (
                      <Badge className="rounded-full border-none bg-amber-200 text-amber-900">
                        открояван
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${
                          i < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {r.createdAt.toLocaleDateString("bg-BG")}
                    </span>
                  </div>
                </div>
                <Badge className={`rounded-full border-none ${STATUS_META[r.status].cls}`}>
                  {STATUS_META[r.status].label}
                </Badge>
              </div>

              <p className="mt-4 text-pretty text-foreground/85">„{r.text}“</p>

              <div className="mt-5">
                <ReviewActions
                  id={r.id}
                  featured={r.featured}
                  ops={
                    r.status === "PENDING"
                      ? ["approve", "reject", "delete"]
                      : r.status === "APPROVED"
                        ? ["feature", "pending", "reject", "delete"]
                        : ["approve", "pending", "delete"]
                  }
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

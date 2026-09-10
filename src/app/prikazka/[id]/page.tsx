import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";

export const metadata: Metadata = {
  title: "Твоята приказка",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * The finished story, before any of it is drawn.
 *
 * Text only for now, and deliberately so: the writing is the part most worth
 * rejecting, it costs pennies to redo, and showing it first means nobody pays
 * for twenty illustrations of a story they did not want. The page-flip preview
 * arrives with the illustrations.
 */
export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      characters: { orderBy: { ordinal: "asc" } },
      pages: { orderBy: { pageNumber: "asc" } },
    },
  });
  if (!book) notFound();

  const story = book.pages.filter((p) => p.kind === "STORY");
  const dedication = book.pages.find((p) => p.kind === "DEDICATION");

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-sand">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <BookOpen className="size-4" strokeWidth={1.5} /> Твоята приказка
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="mt-3 text-lg text-muted-foreground">{book.subtitle}</p>
            )}
            <p className="mt-5 text-sm text-muted-foreground">
              {story.length} страници · за{" "}
              {book.characters.map((c) => c.name).join(" и ")}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {dedication?.text && (
            <p className="mb-10 whitespace-pre-line border-l-2 border-clay pl-5 font-heading text-lg italic">
              {dedication.text}
            </p>
          )}

          <ol className="space-y-8">
            {story.map((p, i) => (
              <li key={p.id} className="grid gap-3 sm:grid-cols-[3rem_1fr]">
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-pretty leading-relaxed">{p.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-xl bg-sand p-6 ring-1 ring-border">
            <p className="font-heading text-lg font-bold">Илюстрациите са следващи</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Историята е готова. Рисуването на страниците още се разработва — щом
              е готово, ще видиш книжката прелистена, преди да я поръчаш.
            </p>
            <Link
              href="/prikazka"
              className="mt-5 inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Направи друга приказка
            </Link>
          </div>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

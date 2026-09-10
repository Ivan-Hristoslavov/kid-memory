import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, MessageSquareQuote, Palette } from "lucide-react";

/**
 * What you give, and what you get back.
 *
 * The homepage showed finished products everywhere and never once showed the
 * transformation, which is the entire differentiator: a visitor could scroll
 * the whole page and still not grasp that the picture on the mug is THEIRS.
 * "Как работи" describes the process in three icons; that is not the same as
 * seeing the result.
 *
 * The three inputs are deliberately concrete — a filename, an actual sentence
 * somebody submitted, a named style — rather than "снимка / текст / стил".
 * A real example is what makes the promise legible.
 */
const INPUTS = [
  {
    icon: Camera,
    label: "Снимката",
    value: "IMG_4821.HEIC",
    hint: "една ясна снимка, нищо повече",
  },
  {
    icon: MessageSquareQuote,
    label: "Думите",
    value: "„апум“ — паун",
    hint: "две до шест, колкото искаш",
  },
  {
    icon: Palette,
    label: "Стилът",
    value: "Приказна илюстрация",
    hint: "шест на избор",
  },
];

export function Transformation() {
  return (
    <section className="border-b border-border bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            От три полета до стената
          </p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Ти попълваш три неща.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Останалото — рисунката, надписите, печатът и доставката — е наша
            работа.
          </p>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-12">
          <ul className="space-y-3">
            {INPUTS.map((f, i) => (
              <li
                key={f.label}
                className="flex items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-border"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-forest ring-1 ring-border">
                  <f.icon className="size-4" strokeWidth={1.5} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {i + 1}. {f.label}
                  </span>
                  <span className="mt-1 block truncate text-base font-semibold">
                    {f.value}
                  </span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-center">
            <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
              <ArrowRight className="hidden size-5 lg:block" />
              <ArrowRight className="size-5 rotate-90 lg:hidden" />
            </span>
          </div>

          {/* The actual poster those three inputs produce — the same sample the
              carousel shows, so the page never promises one thing and shows
              another. */}
          <div className="mx-auto w-full max-w-[19rem]">
            <div className="overflow-hidden rounded-xl bg-card p-3 ring-1 ring-border">
              <Image
                src="/samples/storybook.webp"
                alt="Готов постер „Думичките на Боби“ — илюстрация по снимка с надписи на български"
                width={768}
                height={1152}
                sizes="(max-width: 1024px) 80vw, 304px"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-xl font-bold sm:text-2xl">
            Виждаш готовия постер, преди да платиш.
          </p>
          <Link
            href="/create"
            className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
          >
            Пробвай безплатно
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

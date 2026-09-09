import { Gift, ImagePlus, MousePointerClick } from "lucide-react";

/** Three steps, as the reference states them. */
const STEPS = [
  {
    icon: MousePointerClick,
    title: "Избери продукт",
    text: "Разгледай чашите, тениските, рамките и всичко останало.",
  },
  {
    icon: ImagePlus,
    title: "Персонализирай",
    text: "Добави снимка, име, дата или послание.",
  },
  {
    icon: Gift,
    title: "Подари усмивка",
    text: "Отпечатваме, опаковаме и изпращаме до получателя.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-sand py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Как работи
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-background ring-1 ring-border">
                <s.icon className="size-5 text-forest" strokeWidth={1.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="mt-0.5 block font-semibold text-foreground">
                  {s.title}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {s.text}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

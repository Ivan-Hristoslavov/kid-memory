"use client";

/**
 * The band of real submissions, drifting past under the hero.
 *
 * This is the one place on the page where the shop sounds like a person rather
 * than a category. Every other line — "Подарък, който е наистина личен",
 * "Направи го уникален", "Избери продукт" — could sit on any print-on-demand
 * storefront in any country without changing a thing. „апум" for паун could
 * not.
 *
 * It is also not decoration: the product IS this content. Somebody who does not
 * yet know what to put on a mug reads three of these and knows.
 *
 * Replace WORDS with real submissions as soon as there are enough — invented
 * examples are the one thing visitors can smell.
 */
const WORDS: { said: string; real: string }[] = [
  { said: "апум", real: "паун" },
  { said: "Ще го оправим в понеделник", real: "всеки петък" },
  { said: "лисапед", real: "велосипед" },
  { said: "Лае по прахосмукачката", real: "Рекс" },
  { said: "прахумосмачка", real: "прахосмукачка" },
  { said: "Първо кафе, после проблеми", real: "шефът" },
  { said: "тактул", real: "трактор" },
  { said: "Аз не хъркам", real: "Иван" },
  { said: "хелкоптел", real: "хеликоптер" },
  { said: "Спи върху клавиатурата", real: "Мая" },
  { said: "3.450 кг", real: "тегло" },
  { said: "Аз само за пет минути", real: "колегата" },
  { said: "опокоп", real: "октопод" },
  { said: "Краде чорапи и ги крие", real: "Бади" },
  { said: "шоколата", real: "шоколад" },
];

function Chip({ said, real }: { said: string; real: string }) {
  return (
    <span className="mx-1.5 inline-flex shrink-0 items-baseline gap-2.5 rounded-lg bg-card px-4 py-2.5 ring-1 ring-border">
      {/* The serif is reserved for headlines and quotes, and these are quotes. */}
      <span className="font-heading text-base font-bold sm:text-lg">„{said}“</span>
      <span className="text-xs text-muted-foreground">{real}</span>
    </span>
  );
}

function Row({ reverse = false, duration }: { reverse?: boolean; duration: string }) {
  // Rendered twice so the -50% translation lands on an identical frame and the
  // loop has no visible seam.
  const items = [...WORDS, ...WORDS];
  return (
    <div
      className="marquee-track py-1.5"
      style={
        {
          "--marquee-duration": duration,
          animationDirection: reverse ? "reverse" : "normal",
        } as React.CSSProperties
      }
    >
      {items.map((w, i) => (
        <Chip key={`${w.said}-${i}`} said={w.said} real={w.real} />
      ))}
    </div>
  );
}

export function WordMarquee() {
  return (
    <section
      className="overflow-hidden border-b border-border bg-sand py-10 sm:py-12"
      aria-label="Примери за надписи от нашите поръчки"
    >
      <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Всеки си има свой речник
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
          Детето, колегата, кучето. Ето какво слагат другите върху своя подарък.
          Твоят какво ще каже?
        </p>
      </div>

      {/* Fades the rows into the page instead of cutting them at the edge. */}
      <div
        className="space-y-1 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        aria-hidden
      >
        <Row duration="72s" />
        <Row duration="86s" reverse />
      </div>
    </section>
  );
}

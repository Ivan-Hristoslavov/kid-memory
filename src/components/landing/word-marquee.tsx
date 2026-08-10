"use client";

/**
 * Endless band of poster lines drifting past.
 *
 * The product IS this content, so a marquee here is not decoration — it shows
 * the range of what people submit, fills a wide strip that would otherwise be
 * empty, and rewards a second look. Two rows travelling in opposite directions
 * read as motion rather than as a single sliding bar.
 *
 * Deliberately mixed across templates: a band of nothing but toddler words was
 * the strongest "this shop is for parents" signal on the page, and it sat
 * directly under the hero.
 *
 * Replace WORDS with real submissions as soon as there are any — invented
 * examples are the one thing visitors can smell.
 */
const WORDS: { said: string; real: string }[] = [
  { said: "лисапед", real: "велосипед" },
  { said: "Ще го оправим в понеделник", real: "всеки петък" },
  { said: "прахумосмачка", real: "прахосмукачка" },
  { said: "Лае по прахосмукачката", real: "Рекс" },
  { said: "Първо кафе, после проблеми", real: "шефът" },
  { said: "хелкоптел", real: "хеликоптер" },
  { said: "Аз не хъркам", real: "Иван" },
  { said: "3.450 кг", real: "тегло" },
  { said: "апум", real: "паун" },
  { said: "Спи върху клавиатурата", real: "Мая" },
  { said: "Аз само за пет минути", real: "колегата" },
  { said: "опокоп", real: "октопод" },
  { said: "Краде чорапи и ги крие", real: "Бади" },
  { said: "шоколата", real: "шоколад" },
];

/**
 * Every fifth chip is inked instead of tinted. Five rotating pastels read as a
 * nursery alphabet strip; paper-white cards with one accent read as a wall of
 * quotes, which is what these are.
 */
function Chip({ said, real, i }: { said: string; real: string; i: number }) {
  const accent = i % 5 === 2;
  return (
    <span
      className={`${
        accent ? "bg-secondary" : "bg-card"
      } elevate-sm mx-2 inline-flex shrink-0 items-baseline gap-2.5 rounded-lg px-5 py-3 ring-1 ring-border/70`}
    >
      <span className="font-heading text-lg font-bold sm:text-xl">„{said}“</span>
      <span className="text-sm text-foreground/50">{real}</span>
    </span>
  );
}

function Row({ reverse = false, duration }: { reverse?: boolean; duration: string }) {
  // The list is rendered twice so the -50% translation lands on an identical
  // frame and the loop has no visible seam.
  const items = [...WORDS, ...WORDS];
  return (
    <div
      className="marquee-track py-2"
      style={
        {
          "--marquee-duration": duration,
          animationDirection: reverse ? "reverse" : "normal",
        } as React.CSSProperties
      }
    >
      {items.map((w, i) => (
        <Chip key={`${w.said}-${i}`} said={w.said} real={w.real} i={i} />
      ))}
    </div>
  );
}

export function WordMarquee() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-16" aria-label="Примери за реплики от постери">
      <div className="mx-auto mb-8 max-w-2xl px-6 text-center">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          Всеки си има свой речник
        </h2>
        <p className="mt-2 text-muted-foreground">
          Детето, колегата, кучето. Ето какво слагат другите. Твоят какво казва?
        </p>
      </div>

      {/* Fades the rows into the page instead of cutting them at the edge. */}
      <div
        className="space-y-1 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        aria-hidden
      >
        <Row duration="72s" />
        <Row duration="86s" reverse />
      </div>
    </section>
  );
}

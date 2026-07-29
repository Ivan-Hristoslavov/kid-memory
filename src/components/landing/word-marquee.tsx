"use client";

/**
 * Endless band of mispronunciations drifting past.
 *
 * The product IS this content, so a marquee here is not decoration — it shows
 * the range of what people submit, fills a wide strip that would otherwise be
 * empty, and rewards a second look. Two rows travelling in opposite directions
 * read as motion rather than as a single sliding bar.
 *
 * Replace WORDS with real submissions as soon as there are any — invented
 * examples are the one thing visitors can smell.
 */
const WORDS: { said: string; real: string }[] = [
  { said: "лисапед", real: "велосипед" },
  { said: "прахумосмачка", real: "прахосмукачка" },
  { said: "хелкоптел", real: "хеликоптер" },
  { said: "апум", real: "паун" },
  { said: "тактул", real: "трактор" },
  { said: "майпуна", real: "маймуна" },
  { said: "аляяя", real: "вода" },
  { said: "опокоп", real: "октопод" },
  { said: "мецан", real: "мечок" },
  { said: "кококо", real: "кокошка" },
  { said: "шоколата", real: "шоколад" },
  { said: "драконьо", real: "дракон" },
];

const TINTS = ["bg-blush/70", "bg-mint/70", "bg-sky/70", "bg-peach/70", "bg-lavender/70"];

function Chip({ said, real, i }: { said: string; real: string; i: number }) {
  return (
    <span
      className={`${TINTS[i % TINTS.length]} elevate-sm mx-2 inline-flex shrink-0 items-baseline gap-2.5 rounded-2xl px-5 py-3`}
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
    <section className="relative overflow-hidden py-14 sm:py-16" aria-label="Примери за детски думички">
      <div className="mx-auto mb-8 max-w-2xl px-6 text-center">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          Всяко дете си има свой речник
        </h2>
        <p className="mt-2 text-muted-foreground">
          Ето какво чуват другите родители. Твоето какво казва?
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

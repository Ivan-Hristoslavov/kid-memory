"use client";

import { ADVENTURES, MUST_INCLUDE_SUGGESTIONS, AGE_GROUPS, MOODS, BOOK_STYLES } from "@/lib/books/catalog";
import { iconFor } from "@/lib/icons";
import { useBookWizard } from "@/lib/store/book-wizard";

/** The adventure, and the escape hatch for a parent who already knows. */
export function StepAdventure() {
  const adventure = useBookWizard((s) => s.adventure);
  const customIdea = useBookWizard((s) => s.customIdea);
  const set = useBookWizard((s) => s.set);

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADVENTURES.map((a) => {
          const Icon = iconFor(a.icon);
          const active = adventure === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => set("adventure", a.id)}
                aria-pressed={active}
                className={`flex h-full w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-foreground bg-sand"
                    : "border-border bg-background hover:border-foreground/40"
                }`}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-sand text-forest ring-1 ring-border">
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.blurb}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {adventure === "CUSTOM" && (
        <div className="mt-5">
          <label className="text-sm font-medium">Опиши какво искаш да се случи</label>
          <textarea
            value={customIdea}
            onChange={(e) => set("customIdea", e.target.value.slice(0, 800))}
            rows={4}
            placeholder="Искам Мартин и Анна да намерят тайна врата в стаята си, която ги отвежда в свят с динозаври."
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
          />
          <p className="mt-1 text-xs text-muted-foreground">{customIdea.length} / 800</p>
        </div>
      )}
    </div>
  );
}

/** Age, mood, what must appear, the drawing style, and the dedication. */
export function StepSettings() {
  const s = useBookWizard();

  return (
    <div className="space-y-7">
      <Choice
        label="За каква възраст"
        options={AGE_GROUPS}
        value={s.ageGroup}
        onSelect={(v) => s.set("ageGroup", v)}
      />
      <Choice
        label="Настроение"
        options={MOODS}
        value={s.mood}
        onSelect={(v) => s.set("mood", v)}
      />
      <Choice
        label="Стил на илюстрациите"
        options={BOOK_STYLES.map((b) => ({ id: b.id, name: b.name, blurb: b.blurb }))}
        value={s.style}
        onSelect={(v) => s.set("style", v)}
      />

      <div>
        <p className="text-sm font-medium">
          Какво задължително трябва да присъства?{" "}
          <span className="font-normal text-muted-foreground">(по избор)</span>
        </p>
        {/* Chips rather than an empty box: most parents do not think to mention
            the grandmother or the dog until they are reminded they can. */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {MUST_INCLUDE_SUGGESTIONS.map((v) => {
            const on = s.mustInclude.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => s.toggleMustInclude(v)}
                aria-pressed={on}
                className={`h-9 rounded-lg border px-3 text-sm transition-colors ${
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:border-foreground/40"
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">
          Посвещение{" "}
          <span className="font-normal text-muted-foreground">(по избор)</span>
        </label>
        <textarea
          value={s.dedication}
          onChange={(e) => s.set("dedication", e.target.value.slice(0, 240))}
          rows={3}
          placeholder={"За Мартин и Анна,\nс цялата любов на мама и тати."}
          className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Отпечатва се на отделна страница в началото. {s.dedication.length} / 240
        </p>
      </div>
    </div>
  );
}

function Choice({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly { id: string; name: string; blurb: string }[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                aria-pressed={active}
                className={`flex h-full w-full flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-foreground bg-sand"
                    : "border-border bg-background hover:border-foreground/40"
                }`}
              >
                <span className="text-sm font-semibold">{o.name}</span>
                <span className="text-xs text-muted-foreground">{o.blurb}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

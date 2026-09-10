"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { createBook, type CreateBookState } from "@/app/actions/books";
import { charactersReady, useBookWizard } from "@/lib/store/book-wizard";
import { StepCharacters } from "./step-characters";
import { StepAdventure, StepSettings } from "./step-story";

/**
 * The book wizard.
 *
 * The relationships step only exists when there is more than one child, so the
 * steps are built from state rather than fixed — a single-child book should not
 * be asked who gets on with whom.
 */
function useSteps() {
  const many = useBookWizard((s) => s.characters.length > 1);
  return [
    { id: "characters", title: "Кои са героите?" },
    ...(many ? [{ id: "relationships", title: "Какви са един на друг?" }] : []),
    { id: "adventure", title: "Каква приказка?" },
    { id: "settings", title: "Как да звучи?" },
  ];
}

export function BookWizard() {
  const steps = useSteps();
  const router = useRouter();
  const s = useBookWizard();
  const step = Math.min(s.step, steps.length - 1);
  const current = steps[step];

  const [state, action, pending] = useActionState<CreateBookState, FormData>(
    async (prev, fd) => {
      const result = await createBook(prev, fd);
      if (result.bookId) router.push(`/prikazka/${result.bookId}`);
      return result;
    },
    {}
  );

  const canAdvance =
    current.id === "characters"
      ? charactersReady(s.characters)
      : current.id === "adventure"
        ? s.adventure !== "" &&
          (s.adventure !== "CUSTOM" || s.customIdea.trim().length > 10)
        : true;

  const last = step === steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="flex items-center gap-2" aria-label="Стъпки">
        {steps.map((st, i) => (
          <li key={st.id} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold transition-colors ${
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </li>
        ))}
      </ol>

      <h1 className="mt-8 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {current.title}
      </h1>

      <div className="mt-8">
        {current.id === "characters" && <StepCharacters />}
        {current.id === "relationships" && <StepRelationships />}
        {current.id === "adventure" && <StepAdventure />}
        {current.id === "settings" && <StepSettings />}
      </div>

      {state.error && (
        <p className="mt-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <form action={action} className="mt-8 flex items-center gap-3 border-t border-border pt-6">
        <input type="hidden" name="book" value={serialise(s)} />

        {step > 0 && (
          <button
            type="button"
            onClick={() => s.setStep(step - 1)}
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" /> Назад
          </button>
        )}

        {last ? (
          <button
            type="submit"
            disabled={pending || !canAdvance}
            className="ml-auto inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Пишем приказката…
              </>
            ) : (
              <>
                <Sparkles className="size-4" strokeWidth={1.5} /> Създай приказката
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => s.setStep(step + 1)}
            disabled={!canAdvance}
            className="ml-auto inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85 disabled:opacity-50"
          >
            Напред <ArrowRight className="size-4" />
          </button>
        )}
      </form>

      {current.id === "characters" && !charactersReady(s.characters) && (
        <p className="mt-3 text-xs text-muted-foreground">
          За всяко дете трябват име и снимка.
        </p>
      )}
    </div>
  );
}

function StepRelationships() {
  const value = useBookWizard((s) => s.relationships);
  const set = useBookWizard((s) => s.set);
  const names = useBookWizard((s) =>
    s.characters.map((c) => c.name.trim()).filter(Boolean)
  );

  return (
    <div>
      <label className="text-sm font-medium">
        Разкажете ни за отношенията между героите
      </label>
      <textarea
        value={value}
        onChange={(e) => set("relationships", e.target.value.slice(0, 500))}
        rows={5}
        placeholder={
          names.length >= 2
            ? `${names[0]} е по-големият брат и винаги пази ${names[1]}. ${names[1]} е по-смела и често измисля приключенията.`
            : "Кой на кого какъв е и как се държат заедно."
        }
        className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Това наистина влиза в историята — определя кой води, кой се притеснява и
        кой започва приключението. {value.length} / 500
      </p>
    </div>
  );
}

/** Only what the server needs; the preview URLs and ids stay in the browser. */
function serialise(s: ReturnType<typeof useBookWizard.getState>): string {
  return JSON.stringify({
    characters: s.characters.map((c) => ({
      name: c.name.trim(),
      age: c.age ? Number(c.age) : null,
      gender: c.gender || null,
      description: c.description.trim() || undefined,
      interests: c.interests.trim() || undefined,
      favouriteToy: c.favouriteToy.trim() || undefined,
      favouriteAnimal: c.favouriteAnimal.trim() || undefined,
      photoKey: c.photoKey,
    })),
    relationships: s.relationships.trim() || undefined,
    adventure: s.adventure,
    customIdea: s.customIdea.trim() || undefined,
    ageGroup: s.ageGroup,
    mood: s.mood,
    mustInclude: s.mustInclude,
    style: s.style,
    dedication: s.dedication.trim() || undefined,
    leadEmail: s.leadEmail || undefined,
  });
}

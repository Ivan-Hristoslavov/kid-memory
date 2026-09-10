"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_CHARACTERS,
  MAX_CHARACTERS,
} from "@/lib/books/catalog";

/**
 * The book wizard's state.
 *
 * `sessionStorage`, like the poster wizard and unlike the basket: a half-filled
 * form is a draft, and finding it still there on a new visit weeks later is
 * unsettling rather than helpful. A basket is the opposite, which is why that
 * one uses localStorage.
 *
 * Fields are strings because they come straight from inputs; the server coerces
 * and validates. The store's job is to remember, not to be correct.
 */
export interface BookCharacterDraft {
  id: string;
  name: string;
  age: string;
  gender: "BOY" | "GIRL" | "";
  /** The free-text box: "Мартин е на 5. Обича динозаври…" */
  description: string;
  interests: string;
  favouriteToy: string;
  favouriteAnimal: string;
  /** Private storage key of the uploaded photo. */
  photoKey: string;
  photoPreviewUrl: string;
}

function newCharacter(): BookCharacterDraft {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random()),
    name: "",
    age: "",
    gender: "",
    description: "",
    interests: "",
    favouriteToy: "",
    favouriteAnimal: "",
    photoKey: "",
    photoPreviewUrl: "",
  };
}

export interface BookWizardState {
  step: number;
  characters: BookCharacterDraft[];
  relationships: string;
  adventure: string;
  customIdea: string;
  ageGroup: string;
  mood: string;
  mustInclude: string[];
  style: string;
  dedication: string;
  leadEmail: string;
  /** Set once the book row exists. */
  bookId: string;

  setStep: (n: number) => void;
  addCharacter: () => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, patch: Partial<Omit<BookCharacterDraft, "id">>) => void;
  set: <K extends keyof BookWizardState>(key: K, value: BookWizardState[K]) => void;
  toggleMustInclude: (value: string) => void;
  reset: () => void;
}

const initial = () => ({
  step: 0,
  // Two is the case the brief asks the wizard to optimise for, so it opens on
  // two rather than making the common path an extra click.
  characters: Array.from({ length: DEFAULT_CHARACTERS }, newCharacter),
  relationships: "",
  adventure: "",
  customIdea: "",
  ageGroup: "AGE_5_7",
  mood: "MAGICAL",
  mustInclude: [] as string[],
  style: "SOFT",
  dedication: "",
  leadEmail: "",
  bookId: "",
});

export const useBookWizard = create<BookWizardState>()(
  persist(
    (setState) => ({
      ...initial(),

      setStep: (step) => setState({ step }),

      addCharacter: () =>
        setState((s) =>
          s.characters.length >= MAX_CHARACTERS
            ? s
            : { characters: [...s.characters, newCharacter()] }
        ),

      removeCharacter: (id) =>
        setState((s) =>
          s.characters.length <= 1
            ? s
            : { characters: s.characters.filter((c) => c.id !== id) }
        ),

      updateCharacter: (id, patch) =>
        setState((s) => ({
          characters: s.characters.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      set: (key, value) => setState({ [key]: value } as Partial<BookWizardState>),

      toggleMustInclude: (value) =>
        setState((s) => ({
          mustInclude: s.mustInclude.includes(value)
            ? s.mustInclude.filter((v) => v !== value)
            : [...s.mustInclude, value],
        })),

      reset: () => setState(initial()),
    }),
    {
      name: "menty-book-wizard",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
    }
  )
);

/** Every character needs a name and a photo before the story can be written. */
export function charactersReady(chars: readonly BookCharacterDraft[]): boolean {
  return chars.every((c) => c.name.trim().length >= 2 && c.photoKey !== "");
}

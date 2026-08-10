"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_TEMPLATE,
  TEMPLATES,
  type PosterLine,
  type TemplateId,
} from "@/lib/templates";

export type { PosterLine };

/**
 * A subject in the wizard — a child, a colleague, a dog. All fields are held as
 * strings because they come straight from form inputs; the server coerces and
 * validates. Which of them are actually asked for is decided by the template
 * (see `lib/templates.ts`), not by this store.
 */
export interface WizardSubject {
  id: string;
  name: string;
  age: string;
  gender: "MALE" | "FEMALE" | "";
  relation: string;
  species: string;
  lines: PosterLine[];
}

function newSubject(): WizardSubject {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random()),
    name: "",
    age: "",
    gender: "",
    relation: "",
    species: "",
    lines: [],
  };
}

/** A template's opening state — COUPLE starts with two people, not one. */
function subjectsFor(template: TemplateId): WizardSubject[] {
  return Array.from({ length: TEMPLATES[template].subject.min }, newSubject);
}

export interface WizardState {
  step: number;
  template: TemplateId;
  subjects: WizardSubject[];
  photoKey: string;
  photoPreviewUrl: string;
  leadEmail: string;
  animals: string[];
  style: string;
  orderId: string;
  previewUrl: string;
  finalUrl: string;

  setStep: (step: number) => void;
  setTemplate: (template: TemplateId) => void;
  addSubject: () => void;
  removeSubject: (id: string) => void;
  updateSubject: (
    id: string,
    patch: Partial<Omit<WizardSubject, "id" | "lines">>
  ) => void;
  addLine: (subjectId: string, line: PosterLine) => void;
  updateLine: (subjectId: string, index: number, line: PosterLine) => void;
  removeLine: (subjectId: string, index: number) => void;
  setPhoto: (key: string, previewUrl: string) => void;
  setLeadEmail: (email: string) => void;
  toggleAnimal: (id: string) => void;
  setStyle: (id: string) => void;
  setGenerated: (orderId: string, previewUrl: string, finalUrl?: string) => void;
  reset: () => void;
}

const initial = () => ({
  step: 0,
  template: DEFAULT_TEMPLATE,
  subjects: subjectsFor(DEFAULT_TEMPLATE),
  photoKey: "",
  photoPreviewUrl: "",
  leadEmail: "",
  animals: [] as string[],
  style: "",
  orderId: "",
  previewUrl: "",
  finalUrl: "",
});

export const useWizard = create<WizardState>()(
  persist(
    (set) => ({
      ...initial(),
      setStep: (step) => set({ step }),
      // Switching template wipes the subjects on purpose: "лисапед / велосипед"
      // is nonsense on a pet poster, and a half-filled form from the previous
      // template reads as a bug.
      setTemplate: (template) =>
        set((s) =>
          s.template === template ? s : { template, subjects: subjectsFor(template) }
        ),
      addSubject: () =>
        set((s) =>
          s.subjects.length >= TEMPLATES[s.template].subject.max
            ? s
            : { subjects: [...s.subjects, newSubject()] }
        ),
      removeSubject: (id) =>
        set((s) => ({
          subjects:
            s.subjects.length > TEMPLATES[s.template].subject.min
              ? s.subjects.filter((c) => c.id !== id)
              : s.subjects,
        })),
      updateSubject: (id, patch) =>
        set((s) => ({
          subjects: s.subjects.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      addLine: (subjectId, line) =>
        set((s) => ({
          subjects: s.subjects.map((c) =>
            c.id === subjectId ? { ...c, lines: [...c.lines, line] } : c
          ),
        })),
      updateLine: (subjectId, index, line) =>
        set((s) => ({
          subjects: s.subjects.map((c) =>
            c.id === subjectId
              ? { ...c, lines: c.lines.map((x, i) => (i === index ? line : x)) }
              : c
          ),
        })),
      removeLine: (subjectId, index) =>
        set((s) => ({
          subjects: s.subjects.map((c) =>
            c.id === subjectId
              ? { ...c, lines: c.lines.filter((_, i) => i !== index) }
              : c
          ),
        })),
      setPhoto: (photoKey, photoPreviewUrl) => set({ photoKey, photoPreviewUrl }),
      setLeadEmail: (leadEmail) => set({ leadEmail }),
      toggleAnimal: (id) =>
        set((s) => ({
          animals: s.animals.includes(id)
            ? s.animals.filter((a) => a !== id)
            : s.animals.length < 4
              ? [...s.animals, id]
              : s.animals,
        })),
      setStyle: (style) => set({ style }),
      setGenerated: (orderId, previewUrl, finalUrl = "") =>
        set({ orderId, previewUrl, finalUrl }),
      reset: () => set(initial()),
    }),
    {
      name: "biserite-wizard",
      // Bumped when `children` became `subjects`. Without this, a tab open
      // across the deploy rehydrates the old shape and every `subjects.map`
      // throws on undefined.
      version: 2,
      migrate: () => initial(),
      // Session-scoped: a refresh keeps your progress, but a new visit always
      // starts with an empty form instead of last time's subjects and lines.
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as never) : sessionStorage
      ),
      // Persist only input data; step + generation results are session-scoped.
      partialize: (s) => ({
        template: s.template,
        subjects: s.subjects,
        photoKey: s.photoKey,
        leadEmail: s.leadEmail,
        animals: s.animals,
        style: s.style,
      }),
    }
  )
);

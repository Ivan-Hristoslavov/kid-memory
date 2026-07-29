"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface FunnyWord {
  word: string;
  saidAs: string;
  /** Optional: what to draw beside this bubble (e.g. "октопод"). */
  visual?: string;
}

export interface Child {
  id: string;
  name: string;
  age: string;
  gender: "BOY" | "GIRL" | "";
  words: FunnyWord[];
}

export const MAX_CHILDREN = 3;

function newChild(): Child {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random()),
    name: "",
    age: "",
    gender: "",
    words: [],
  };
}

export interface WizardState {
  step: number;
  children: Child[];
  photoKey: string;
  photoPreviewUrl: string;
  leadEmail: string;
  animals: string[];
  style: string;
  orderId: string;
  previewUrl: string;
  finalUrl: string;

  setStep: (step: number) => void;
  addChild: () => void;
  removeChild: (id: string) => void;
  updateChild: (id: string, patch: Partial<Omit<Child, "id" | "words">>) => void;
  addWord: (childId: string, w: FunnyWord) => void;
  updateWord: (childId: string, index: number, w: FunnyWord) => void;
  removeWord: (childId: string, index: number) => void;
  setPhoto: (key: string, previewUrl: string) => void;
  setLeadEmail: (email: string) => void;
  toggleAnimal: (id: string) => void;
  setStyle: (id: string) => void;
  setGenerated: (orderId: string, previewUrl: string, finalUrl?: string) => void;
  reset: () => void;
}

const initial = () => ({
  step: 0,
  children: [newChild()],
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
      addChild: () =>
        set((s) => (s.children.length >= MAX_CHILDREN ? s : { children: [...s.children, newChild()] })),
      removeChild: (id) =>
        set((s) => ({
          children: s.children.length > 1 ? s.children.filter((c) => c.id !== id) : s.children,
        })),
      updateChild: (id, patch) =>
        set((s) => ({
          children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      addWord: (childId, w) =>
        set((s) => ({
          children: s.children.map((c) =>
            c.id === childId ? { ...c, words: [...c.words, w] } : c
          ),
        })),
      updateWord: (childId, index, w) =>
        set((s) => ({
          children: s.children.map((c) =>
            c.id === childId
              ? { ...c, words: c.words.map((x, i) => (i === index ? w : x)) }
              : c
          ),
        })),
      removeWord: (childId, index) =>
        set((s) => ({
          children: s.children.map((c) =>
            c.id === childId ? { ...c, words: c.words.filter((_, i) => i !== index) } : c
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
      // Session-scoped: a refresh keeps your progress, but a new visit always
      // starts with an empty form instead of last time's child and words.
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as never) : sessionStorage
      ),
      // Persist only input data; step + generation results are session-scoped.
      partialize: (s) => ({
        children: s.children,
        photoKey: s.photoKey,
        leadEmail: s.leadEmail,
        animals: s.animals,
        style: s.style,
      }),
    }
  )
);

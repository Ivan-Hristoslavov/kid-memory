"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWizard } from "@/lib/store/wizard";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import { trackFunnel } from "@/components/site/analytics";
import { StepTemplate } from "./step-template";
import { StepChild } from "./step-child";
import { StepWords } from "./step-words";
// Animals step is disabled for now — per-word visuals replaced it.
// import { StepAnimals } from "./step-animals";
import { StepStyle } from "./step-style";
import { StepPreview } from "./step-preview";

export const TEMPLATE_STEP = 0;
export const SUBJECT_STEP = 1;
export const LINES_STEP = 2;
export const STYLE_STEP = 3;
export const PREVIEW_STEP = 4;

const STEP_COUNT = 5;

export function Wizard({ initialTemplate }: { initialTemplate: TemplateId | null }) {
  // Deliberately not an effect. Moving the step after mount makes AnimatePresence
  // treat it as a 0 → 1 transition, and because the outgoing step never really
  // rendered, its exit never resolves and the incoming step stays at opacity 0 —
  // a blank wizard. Seeding the store in a lazy initializer runs before the
  // `step` below is read, so the first render is already the right step. Both
  // calls are idempotent, which is what StrictMode's double render needs.
  useState(() => {
    const s = useWizard.getState();
    // Returning after a finished (or abandoned-at-preview) run starts fresh —
    // never drop the user back onto a filled-in form or auto-generate again.
    if (s.step >= PREVIEW_STEP || s.orderId) s.reset();
    // An occasion card or campaign CTA carries the template it promised, so the
    // visitor lands on the matching form instead of picking it again.
    if (initialTemplate) {
      s.setTemplate(initialTemplate);
      s.setStep(SUBJECT_STEP);
    }
    return true;
  });

  const step = useWizard((s) => s.step);
  const template = useWizard((s) => s.template);

  const def = TEMPLATES[template];
  // Titles follow the template — "Разкажи ни за децата" is wrong copy for a dog.
  const stepTitles = [
    "Какъв постер правим?",
    `Разкажи ни за ${def.subject.min > 1 ? def.subject.nounPlural : def.subject.noun}`,
    def.lines.heading,
    "Избери стил",
    "Магията се случва",
  ];

  // Top-of-funnel signal — Purchase volume alone is far too thin for ad
  // platforms to optimise on.
  useEffect(() => {
    trackFunnel("ViewContent", { content_name: "Създаване на постер" });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 lg:max-w-4xl">
      {/* progress */}
      <div className="mb-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <div
                className={`grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm font-bold transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < STEP_COUNT - 1 && (
                <div
                  className={`mx-1 h-1 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <h1 className="mt-8 text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {stepTitles[step]}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
        >
          {step === TEMPLATE_STEP && <StepTemplate />}
          {step === SUBJECT_STEP && <StepChild />}
          {step === LINES_STEP && <StepWords />}
          {step === STYLE_STEP && <StepStyle />}
          {step === PREVIEW_STEP && <StepPreview />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

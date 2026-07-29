"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWizard } from "@/lib/store/wizard";
import { trackFunnel } from "@/components/site/analytics";
import { StepChild } from "./step-child";
import { StepWords } from "./step-words";
// Animals step is disabled for now — per-word visuals replaced it.
// import { StepAnimals } from "./step-animals";
import { StepStyle } from "./step-style";
import { StepPreview } from "./step-preview";

const STEP_TITLES = [
  "Разкажи ни за децата",
  "Добави думичките",
  "Избери стил",
  "Магията се случва",
];

const PREVIEW_STEP = STEP_TITLES.length - 1;

export function Wizard() {
  const step = useWizard((s) => s.step);

  // Entering the wizard after a finished (or abandoned) generation should start
  // a brand-new memory — never drop the user back onto the preview step, which
  // would auto-generate again. Runs once per mount (e.g. clicking "Създай спомен").
  useEffect(() => {
    const s = useWizard.getState();
    // Returning after a finished (or abandoned-at-preview) run starts fresh —
    // never drop the user back onto a filled-in form or auto-generate again.
    if (s.step >= PREVIEW_STEP || s.orderId) {
      s.reset();
    }
    // Top-of-funnel signal — Purchase volume alone is far too thin for ad
    // platforms to optimise on.
    trackFunnel("ViewContent", { content_name: "Създаване на постер" });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 lg:max-w-4xl">
      {/* progress */}
      <div className="mb-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {STEP_TITLES.map((_, i) => (
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
              {i < STEP_TITLES.length - 1 && (
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
          {STEP_TITLES[step]}
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
          {step === 0 && <StepChild />}
          {step === 1 && <StepWords />}
          {step === 2 && <StepStyle />}
          {step === 3 && <StepPreview />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

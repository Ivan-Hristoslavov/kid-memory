"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { iconFor } from "@/lib/icons";
import { AVAILABLE_TEMPLATES, TEMPLATES } from "@/lib/templates";
import { useWizard } from "@/lib/store/wizard";

/**
 * Picks what kind of poster this is. It exists so the shop is not tied to the
 * handful of dates a year when people buy children's gifts — the same photo
 * pipeline sells to a colleague's birthday, an anniversary or a dog.
 *
 * Visitors arriving from an occasion card or a campaign CTA already carry
 * `?template=` and skip straight past this step.
 */
export function StepTemplate() {
  const wizard = useWizard();

  function choose(id: (typeof AVAILABLE_TEMPLATES)[number]) {
    wizard.setTemplate(id);
    wizard.setStep(1);
  }

  return (
    <Card className="bg-card ring-1 ring-border overflow-hidden rounded-xl border-none">
      <CardContent className="space-y-6 p-8">
        <p className="text-center text-muted-foreground">
          Всеки постер тръгва от една снимка. Избери за кого е — останалото питаме
          според избора ти.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {AVAILABLE_TEMPLATES.map((id, i) => {
            const t = TEMPLATES[id];
            const selected = wizard.template === id;
            const Icon = iconFor(t.icon);
            return (
              <motion.button
                key={id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => choose(id)}
                aria-pressed={selected}
                className={`group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all ${
                  selected
                    ? "border-primary shadow-xl shadow-primary/15"
                    : "border-border hover:scale-[1.01] hover:border-primary/40"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-50 transition-opacity group-hover:opacity-70`}
                />
                <div className="relative">
                  {selected && (
                    <span className="absolute right-0 top-0 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                  <span className="grid size-12 place-items-center rounded-xl bg-white/70 text-foreground/75 shadow-sm">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">{t.name}</h3>
                  <p className="mt-1.5 text-sm text-foreground/70">{t.tagline}</p>
                  {/* The chips answer "when would I actually buy this" — the
                      whole reason the template exists. */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.occasions.slice(0, 4).map((o) => (
                      <span
                        key={o}
                        className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-foreground/70"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <Button
          size="lg"
          onClick={() => wizard.setStep(1)}
          className="group h-14 w-full rounded-full text-base shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01]"
        >
          Продължи с „{TEMPLATES[wizard.template].name}“
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ANIMALS } from "@/lib/catalog";
import { iconFor } from "@/lib/icons";
import { useWizard } from "@/lib/store/wizard";

const MAX = 4;

export function StepAnimals() {
  const wizard = useWizard();
  const count = wizard.animals.length;
  const childrenName =
    wizard.children.map((c) => c.name).filter(Boolean).join(" и ") || "детето";

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-none">
      <CardContent className="space-y-6 p-8">
        <div className="rounded-2xl bg-mint/40 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-heading font-bold">
            <PawPrint className="size-4 text-primary" />
            Кои животни да са до {childrenName} на илюстрацията?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Те се появяват като сладки приятелчета в картината. Избери до {MAX}.
          </p>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Избрани: {count} / {MAX}
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={() => wizard.animals.forEach((a) => wizard.toggleAnimal(a))}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Изчисти
            </button>
          )}
        </div>

        <div className="grid max-h-[22rem] grid-cols-3 gap-3 overflow-y-auto p-1 sm:grid-cols-4">
          {ANIMALS.map((animal, i) => {
            const selected = wizard.animals.includes(animal.id);
            const disabled = !selected && count >= MAX;
            const Icon = iconFor(animal.icon);
            return (
              <motion.button
                key={animal.id}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => {
                  if (disabled) {
                    toast.info(`Може да избереш най-много ${MAX} животни`);
                    return;
                  }
                  wizard.toggleAnimal(animal.id);
                }}
                aria-pressed={selected}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                  selected
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                    : disabled
                      ? "border-border bg-card/40 opacity-45"
                      : "border-border bg-card hover:scale-[1.04] hover:border-primary/40"
                }`}
              >
                {selected && (
                  <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
                <span
                  className={`grid size-11 place-items-center rounded-xl transition-colors ${
                    selected ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Icon className="size-6" />
                </span>
                <span className="text-center text-xs font-semibold">{animal.name}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => wizard.setStep(1)}
          >
            <ArrowLeft className="size-4" /> Назад
          </Button>
          <Button
            size="lg"
            className="group flex-1 rounded-full shadow-lg shadow-primary/25"
            onClick={() => {
              if (count === 0) {
                toast.error("Избери поне едно животно");
                return;
              }
              wizard.setStep(3);
            }}
          >
            Продължи
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

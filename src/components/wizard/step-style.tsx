"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Check, Mail, Palette, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STYLES } from "@/lib/catalog";
import { iconFor } from "@/lib/icons";
import { useWizard } from "@/lib/store/wizard";

export function StepStyle() {
  const wizard = useWizard();
  const childrenName =
    wizard.children.map((c) => c.name).filter(Boolean).join(" и ") || "детето";

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-none">
      <CardContent className="space-y-6 p-8">
        <div className="rounded-2xl bg-lavender/40 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-heading font-bold">
            <Palette className="size-4 text-primary" />
            Как да изглежда светът на {childrenName}?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Всеки стил дава различно усещане. Избери любимия.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STYLES.map((style, i) => {
            const selected = wizard.style === style.id;
            const Icon = iconFor(style.icon);
            return (
              <motion.button
                key={style.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => wizard.setStyle(style.id)}
                aria-pressed={selected}
                className={`group relative overflow-hidden rounded-3xl border-2 p-6 text-left transition-all ${
                  selected
                    ? "border-primary shadow-xl shadow-primary/15"
                    : "border-border hover:scale-[1.01] hover:border-primary/40"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50 transition-opacity group-hover:opacity-70`}
                />
                <div className="relative">
                  {selected && (
                    <span className="absolute right-0 top-0 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                  <span className="grid size-12 place-items-center rounded-2xl bg-white/70 text-foreground/75 shadow-sm">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">{style.name}</h3>
                  <p className="mt-1.5 text-sm text-foreground/70">{style.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Lead capture: lets us send the finished poster / a reminder if the
            visitor leaves before ordering. Optional on purpose. */}
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card/60 p-5">
          <Label htmlFor="leadEmail" className="flex items-center gap-2 font-semibold">
            <Mail className="size-4 text-primary" />
            Твоят имейл <span className="font-normal text-muted-foreground">(по избор)</span>
          </Label>
          <Input
            id="leadEmail"
            type="email"
            inputMode="email"
            placeholder="напр. maria@example.com"
            className="mt-2 h-12 rounded-2xl border-2"
            value={wizard.leadEmail}
            onChange={(e) => wizard.setLeadEmail(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Пазим ти готовия постер и ти пращаме връзка, ако решиш да поръчаш по-късно.
          </p>
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
            className="flex-1 rounded-full text-base shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01]"
            onClick={() => {
              if (!wizard.style) {
                toast.error("Избери стил на илюстрацията");
                return;
              }
              wizard.setStep(3);
            }}
          >
            Създай магията
            <Wand2 className="size-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

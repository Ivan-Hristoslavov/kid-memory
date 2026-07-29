"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  MessageSquareHeart,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizard } from "@/lib/store/wizard";

/**
 * Common Bulgarian toddler mispronunciations offered as one-tap chips. Typing
 * two fields per word on a phone is the heaviest moment in the wizard; most
 * parents recognise their own child in this list and fill the step by tapping.
 */
const SUGGESTIONS = [
  { word: "Велосипед", saidAs: "Лисапед", visual: "велосипед" },
  { word: "Прахосмукачка", saidAs: "Прахумосмачка", visual: "прахосмукачка" },
  { word: "Хеликоптер", saidAs: "Хелкоптел", visual: "хеликоптер" },
  { word: "Паун", saidAs: "Апум", visual: "паун" },
  { word: "Трактор", saidAs: "Тактул", visual: "трактор" },
  { word: "Маймуна", saidAs: "Майпуна", visual: "маймуна" },
  { word: "Вода", saidAs: "Аляяяя", visual: "чаша вода" },
  { word: "Октопод", saidAs: "Опокоп", visual: "октопод" },
  { word: "Шоколад", saidAs: "Шоколата", visual: "шоколад" },
  { word: "Кокошка", saidAs: "Кококо", visual: "кокошка" },
];

function ChildWords({ childId, name }: { childId: string; name: string }) {
  const wizard = useWizard();
  const child = wizard.children.find((c) => c.id === childId);
  const [word, setWord] = useState("");
  const [saidAs, setSaidAs] = useState("");
  const [visual, setVisual] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  if (!child) return null;

  function clearForm() {
    setWord("");
    setSaidAs("");
    setVisual("");
    setEditing(null);
  }

  function startEdit(i: number) {
    const w = child!.words[i];
    setWord(w.word);
    setSaidAs(w.saidAs);
    setVisual(w.visual ?? "");
    setEditing(i);
  }

  function save(w?: { word: string; saidAs: string; visual?: string }) {
    const typed = {
      word: word.trim(),
      saidAs: saidAs.trim(),
      // Almost always the drawing IS the real word ("октопод" → октопод), so
      // asking for it separately made people retype what they just wrote.
      // It stays editable for the cases where it isn't ("вода" → "чаша вода").
      visual: visual.trim() || word.trim(),
    };
    const entry = w ?? typed;
    if (!entry.word || !entry.saidAs) {
      toast.error("Попълни думата и как я казва детето");
      return;
    }
    if (editing !== null) {
      wizard.updateWord(childId, editing, entry);
      toast.success("Думичката е обновена");
    } else {
      if (child!.words.length >= 12) {
        toast.error("Максимум 12 думички на дете");
        return;
      }
      wizard.addWord(childId, entry);
    }
    clearForm();
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card/60 p-5">
      <p className="mb-4 inline-flex items-center gap-2 font-heading font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-blush/70 text-foreground/70">
          <MessageSquareHeart className="size-4" />
        </span>
        Думичките на {name}
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Истинската дума</Label>
          <Input
            placeholder="напр. Октопод"
            className="h-11 rounded-2xl border-2"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Sparkles className="size-3 text-primary" /> Как я казва детето
          </Label>
          <Input
            placeholder="напр. Опокоп"
            className="h-11 rounded-2xl border-2"
            value={saidAs}
            onChange={(e) => setSaidAs(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => save()}
            className="h-11 flex-1 rounded-2xl px-5 sm:flex-none"
          >
            {editing !== null ? (
              <>
                <Check className="size-5" /> Запази
              </>
            ) : (
              <>
                <Plus className="size-5" /> Добави
              </>
            )}
          </Button>
          {editing !== null && (
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              className="h-11 rounded-2xl px-3"
              aria-label="Откажи редакцията"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Only surfaced while editing an existing word — the fast path stays two
          fields, and this covers the cases where the drawing isn't the word
          itself ("вода" → "чаша вода"). */}
      {editing !== null && (
        <div className="mt-3 space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <ImagePlus className="size-3 text-primary" /> Какво да нарисуваме до
            балончето
          </Label>
          <Input
            placeholder={word ? `по подразбиране: ${word.toLowerCase()}` : "напр. чаша вода"}
            className="h-11 rounded-2xl border-2"
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
          />
        </div>
      )}

      {(() => {
        // Hide anything already added so the list shrinks as they go.
        const used = new Set(child.words.map((w) => w.saidAs.toLowerCase()));
        const left = SUGGESTIONS.filter((s) => !used.has(s.saidAs.toLowerCase()));
        if (left.length === 0) return null;
        return (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Или избери от честите — с едно докосване:
            </p>
            <div className="flex flex-wrap gap-2">
              {left.slice(0, 8).map((ex) => (
                <button
                  key={ex.saidAs}
                  type="button"
                  onClick={() => save(ex)}
                  className="rounded-full border-2 border-dashed border-primary/30 bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/5"
                >
                  „{ex.saidAs}“
                  <span className="ml-1 font-normal text-muted-foreground">
                    {ex.word.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {child.words.length > 0 && (
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {child.words.map((w, i) => (
              <motion.li
                key={`${w.word}-${w.saidAs}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-center justify-between rounded-xl px-4 py-2 shadow-sm ring-1 transition-colors ${
                  editing === i ? "bg-primary/10 ring-primary/40" : "bg-card ring-border/50"
                }`}
              >
                <div className="min-w-0">
                  <span className="font-heading font-bold">„{w.saidAs}“</span>
                  <span className="ml-2 text-sm text-muted-foreground">вместо {w.word}</span>
                  {w.visual ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      <ImagePlus className="size-3" /> {w.visual}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(i)}
                    aria-label={`Редактирай ${w.saidAs}`}
                    className="rounded-full text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (editing === i) clearForm();
                      wizard.removeWord(childId, i);
                    }}
                    aria-label={`Премахни ${w.saidAs}`}
                    className="rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export function StepWords() {
  const wizard = useWizard();

  function next() {
    for (const c of wizard.children) {
      if (c.words.length === 0) {
        toast.error(`Добави поне една думичка на ${c.name || "детето"}`);
        return;
      }
    }
    wizard.setStep(2);
  }

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-none">
      <CardContent className="space-y-5 p-8">
        <p className="text-center text-muted-foreground">
          Истинската дума и как я казва детето. Двете влизат на постера — голямата
          смешна дума и малката истинска под нея, за да се разбира и след години.
        </p>

        <div className="space-y-4">
          {wizard.children.map((c) => (
            <ChildWords key={c.id} childId={c.id} name={c.name || "детето"} />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => wizard.setStep(0)}
          >
            <ArrowLeft className="size-4" /> Назад
          </Button>
          <Button
            size="lg"
            className="group flex-1 rounded-full shadow-lg shadow-primary/25"
            onClick={next}
          >
            Продължи
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

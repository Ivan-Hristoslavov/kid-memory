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
import { TEMPLATES, type PosterLine, type PosterTemplateDef } from "@/lib/templates";
import { useWizard } from "@/lib/store/wizard";
import { SUBJECT_STEP, STYLE_STEP } from "./wizard";

/**
 * Common Bulgarian toddler mispronunciations offered as one-tap chips. Typing
 * two fields per word on a phone is the heaviest moment in the wizard; most
 * parents recognise their own child in this list and fill the step by tapping.
 * Only KID_WORDS has a list this predictable — the other templates fall back to
 * their own examples, which do the same job of unblocking an empty first row.
 */
const KID_SUGGESTIONS: PosterLine[] = [
  { text: "Лисапед", sub: "Велосипед", visual: "велосипед" },
  { text: "Прахумосмачка", sub: "Прахосмукачка", visual: "прахосмукачка" },
  { text: "Хелкоптел", sub: "Хеликоптер", visual: "хеликоптер" },
  { text: "Апум", sub: "Паун", visual: "паун" },
  { text: "Тактул", sub: "Трактор", visual: "трактор" },
  { text: "Майпуна", sub: "Маймуна", visual: "маймуна" },
  { text: "Аляяяя", sub: "Вода", visual: "чаша вода" },
  { text: "Опокоп", sub: "Октопод", visual: "октопод" },
  { text: "Шоколата", sub: "Шоколад", visual: "шоколад" },
  { text: "Кококо", sub: "Кокошка", visual: "кокошка" },
];

function suggestionsFor(template: PosterTemplateDef): PosterLine[] {
  if (template.id === "KID_WORDS") return KID_SUGGESTIONS;
  return template.lines.examples.map((e) => ({ text: e.text, sub: e.sub }));
}

function SubjectLines({
  subjectId,
  name,
  template,
}: {
  subjectId: string;
  name: string;
  template: PosterTemplateDef;
}) {
  const wizard = useWizard();
  const subject = wizard.subjects.find((s) => s.id === subjectId);
  const cfg = template.lines;
  const [text, setText] = useState("");
  const [sub, setSub] = useState("");
  const [visual, setVisual] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  if (!subject) return null;

  function clearForm() {
    setText("");
    setSub("");
    setVisual("");
    setEditing(null);
  }

  function startEdit(i: number) {
    const line = subject!.lines[i];
    setText(line.text);
    setSub(line.sub ?? "");
    setVisual(line.visual ?? "");
    setEditing(i);
  }

  function save(preset?: PosterLine) {
    const typed: PosterLine = {
      text: text.trim(),
      sub: sub.trim(),
      // Almost always the drawing IS the thing named ("октопод" → октопод), so
      // asking for it separately made people retype what they just wrote. It
      // stays editable for the cases where it isn't ("вода" → "чаша вода").
      visual: visual.trim() || sub.trim(),
    };
    const entry = preset ?? typed;
    if (!entry.text) {
      toast.error(`Попълни ${cfg.textLabel.toLowerCase()}`);
      return;
    }
    if (cfg.subRequired && !entry.sub) {
      toast.error(`Попълни ${cfg.subLabel?.toLowerCase() ?? "второто поле"}`);
      return;
    }
    if (editing !== null) {
      wizard.updateLine(subjectId, editing, entry);
      toast.success("Промяната е запазена");
    } else {
      if (subject!.lines.length >= cfg.max) {
        toast.error(`Максимум ${cfg.max} на постер`);
        return;
      }
      wizard.addLine(subjectId, entry);
    }
    clearForm();
  }

  const suggestions = suggestionsFor(template);
  const used = new Set(subject.lines.map((l) => l.text.toLowerCase()));
  const left = suggestions.filter((s) => !used.has(s.text.toLowerCase()));

  return (
    <div className="rounded-xl border-2 border-border bg-card/60 p-5">
    <p className="mb-4 inline-flex items-center gap-2 font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-secondary text-foreground/70">
          <MessageSquareHeart className="size-4" />
        </span>
        {cfg.heading} — {name}
      </p>

      <div
        className={`grid gap-3 sm:items-end ${
          cfg.subLabel ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]"
        }`}
      >
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Sparkles className="size-3 text-primary" /> {cfg.textLabel}
          </Label>
          <Input
            placeholder={`напр. ${cfg.textPlaceholder}`}
            className="h-11 rounded-xl border-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !cfg.subLabel) {
                e.preventDefault();
                save();
              }
            }}
          />
        </div>
        {cfg.subLabel && (
          <div className="space-y-1.5">
            <Label className="text-xs">{cfg.subLabel}</Label>
            <Input
              placeholder={cfg.subPlaceholder ? `напр. ${cfg.subPlaceholder}` : ""}
              className="h-11 rounded-xl border-2"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
            />
          </div>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => save()}
            className="h-11 flex-1 rounded-xl px-5 sm:flex-none"
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
              className="h-11 rounded-xl px-3"
              aria-label="Откажи редакцията"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Only surfaced while editing an existing row — the fast path stays two
          fields, and this covers the cases where the drawing isn't the thing
          itself ("вода" → "чаша вода"). */}
      {editing !== null && (
        <div className="mt-3 space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <ImagePlus className="size-3 text-primary" /> Какво да нарисуваме до
            балончето
          </Label>
          <Input
            placeholder={sub ? `по подразбиране: ${sub.toLowerCase()}` : "напр. чаша вода"}
            className="h-11 rounded-xl border-2"
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
          />
        </div>
      )}

      {/* Hide anything already added so the list shrinks as they go. */}
      {left.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Или започни от готово — с едно докосване:
          </p>
          <div className="flex flex-wrap gap-2">
            {left.slice(0, 8).map((ex) => (
              <button
                key={ex.text}
                type="button"
                onClick={() => save(ex)}
                className="rounded-full border-2 border-dashed border-primary/30 bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/5"
              >
                „{ex.text}“
                {ex.sub ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    {ex.sub.toLowerCase()}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {subject.lines.length > 0 && (
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {subject.lines.map((l, i) => (
              <motion.li
                key={`${l.text}-${l.sub ?? ""}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-center justify-between rounded-xl px-4 py-2 shadow-sm ring-1 transition-colors ${
                  editing === i ? "bg-primary/10 ring-primary/40" : "bg-card ring-border/50"
                }`}
              >
                <div className="min-w-0">
          <span className="font-bold">„{l.text}“</span>
                  {l.sub ? (
                    <span className="ml-2 text-sm text-muted-foreground">{l.sub}</span>
                  ) : null}
                  {l.visual ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      <ImagePlus className="size-3" /> {l.visual}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(i)}
                    aria-label={`Редактирай ${l.text}`}
                    className="rounded-full text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (editing === i) clearForm();
                      wizard.removeLine(subjectId, i);
                    }}
                    aria-label={`Премахни ${l.text}`}
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
  const template = TEMPLATES[wizard.template];

  function next() {
    for (const s of wizard.subjects) {
      if (s.lines.length < template.lines.min) {
        toast.error(
          `Добави поне ${template.lines.min} на ${s.name || template.subject.noun}`
        );
        return;
      }
    }
    wizard.setStep(STYLE_STEP);
  }

  return (
    <Card className="bg-card ring-1 ring-border overflow-hidden rounded-xl border-none">
      <CardContent className="space-y-5 p-8">
        <p className="text-center text-muted-foreground">{template.lines.help}</p>

        <div className="space-y-4">
          {wizard.subjects.map((s) => (
            <SubjectLines
              key={s.id}
              subjectId={s.id}
              name={s.name || template.subject.noun}
              template={template}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => wizard.setStep(SUBJECT_STEP)}
          >
            <ArrowLeft className="size-4" /> Назад
          </Button>
          <Button
            size="lg"
            className="group flex-1 rounded-lg shadow-none"
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

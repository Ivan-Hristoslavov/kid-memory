"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Cake,
  Camera,
  Heart,
  Loader2,
  Lock,
  PawPrint,
  Plus,
  CircleCheck,
  Sparkle,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_PHOTO_BYTES } from "@/lib/validations";
import { PHOTO_RETENTION_DAYS } from "@/lib/legal";
import { postJson } from "@/lib/fetch-json";
import { TEMPLATES, type PosterTemplateDef } from "@/lib/templates";
import { useWizard } from "@/lib/store/wizard";
import { TEMPLATE_STEP, LINES_STEP } from "./wizard";

/**
 * Age options for a template. Toddlers need halves (2.5 is a different child
 * from 2), adults do not — offering "37.5 г." on a colleague's poster reads as
 * a bug.
 */
function ageOptions(ageMax: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const halves = ageMax <= 30;
  if (halves) {
    for (let a = 0.5; a <= Math.min(6, ageMax); a += 0.5)
      out.push({ value: String(a), label: `${a} г.` });
  }
  for (let a = halves ? 7 : 1; a <= ageMax; a++)
    out.push({ value: String(a), label: `${a} г.` });
  return out;
}

function SubjectIcon({ template }: { template: PosterTemplateDef }) {
  if (template.subject.species === "required") return <PawPrint className="size-4" />;
  if (template.id === "COUPLE") return <Heart className="size-4" />;
  return <User className="size-4" />;
}

export function StepChild() {
  const wizard = useWizard();
  const template = TEMPLATES[wizard.template];
  const { subject } = template;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [photoWarnings, setPhotoWarnings] = useState<string[]>([]);
  /** How many subjects were found in the photo. Null when it was not read. */
  const [photoFaces, setPhotoFaces] = useState<number | null>(null);

  const AGE_OPTIONS = ageOptions(subject.ageMax);

  async function handlePhoto(file: File) {
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Снимката е твърде голяма (макс. 8 MB)");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("photo", file);
      const { ok, data, error } = await postJson<{
        key: string;
        previewUrl: string;
        warnings?: string[];
        faces?: number;
      }>("/api/upload", { method: "POST", body });
      if (!ok) throw new Error(error ?? "Качването не успя");
      wizard.setPhoto(data.key, data.previewUrl);
      setPhotoFaces(typeof data.faces === "number" ? data.faces : null);
      // Quality warnings are advisory — the customer may have only this one
      // photo, so we flag the risk and let them decide rather than blocking.
      if (data.warnings?.length) {
        setPhotoWarnings(data.warnings);
        toast.warning(data.warnings[0]);
      } else {
        setPhotoWarnings([]);
        toast.success("Снимката е качена ✓");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Качването не успя");
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    wizard.setPhoto("", "");
    setPhotoWarnings([]);
    setPhotoFaces(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function next() {
    if (!wizard.photoKey) {
      toast.error("Качи снимка");
      return;
    }
    for (const s of wizard.subjects) {
      const who = s.name.trim() || subject.noun;
      if (s.name.trim().length < 2) {
        toast.error(`Въведи име на ${subject.noun}`);
        return;
      }
      if (subject.age === "required" && (s.age === "" || Number.isNaN(Number(s.age)))) {
        toast.error(`Въведи възраст на ${who}`);
        return;
      }
      if (subject.gender === "required" && !s.gender) {
        toast.error(`Избери пол на ${who}`);
        return;
      }
      if (subject.species === "required" && s.species.trim().length < 2) {
        toast.error(`Въведи вид или порода на ${who}`);
        return;
      }
    }
    wizard.setStep(LINES_STEP);
  }

  const hasPhoto = Boolean(wizard.photoKey && wizard.photoPreviewUrl);
  const multi = wizard.subjects.length > 1;

  /**
   * "Two children named, one face in the photo" is only visible once both are
   * known, and the customer can fix it either way — by changing the photo or by
   * removing a name. So it is computed live from the current subject count and
   * shown as advice, never as a block: the reader occasionally miscounts a face
   * turned away from the camera, and being wrong must not cost an order.
   */
  const countWarning =
    photoFaces !== null && photoFaces > 0 && photoFaces < wizard.subjects.length
      ? `На снимката разпознахме ${photoFaces} от ${subject.nounPlural}, а тук са добавени ${wizard.subjects.length}. Провери дали снимката е правилната — всички трябва да се виждат на нея, за да ги нарисуваме.`
      : null;

  return (
    <Card className="bg-card ring-1 ring-border overflow-hidden rounded-xl border-none">
      <CardContent className="space-y-7 p-8">
        {/* Photo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-base">
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-foreground/70">
              <Camera className="size-4" />
            </span>
            Снимка на {subject.nounPlural}
          </Label>

          {/* Photo guidance — input quality is the single biggest factor in how
              much the illustration ends up looking like the real subject. */}
          <div className="rounded-xl bg-secondary/50 px-4 py-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {["Ясно лице към камерата", "Добра светлина", "Цветна и рязка", "Отблизо"].map(
                (t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    <CircleCheck className="size-4 shrink-0 text-emerald-600" />
                    {t}
                  </span>
                )
              )}
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive/70" />
              <span>
                {template.photoHint} Избягвай тъмни, размазани и силно филтрирани
                снимки.{" "}
                {subject.max > 1 &&
                  `Няколко на една снимка е напълно наред — просто добави всеки от тях по-долу.`}
              </span>
            </p>
          </div>

          {/* The upload button is exactly where someone hesitates — answer the
              privacy question here, not three sections down in the FAQ. */}
          <p className="flex items-start gap-1.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <span>
              Снимката се съхранява защитено, служи само за твоята илюстрация и се
              изтрива автоматично след {PHOTO_RETENTION_DAYS} дни. Никога не я
              публикуваме никъде без изричното ти съгласие.{" "}
              <Link
                href="/snimkite"
                target="_blank"
                className="font-semibold underline underline-offset-2"
              >
                Виж подробно
              </Link>
            </span>
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePhoto(f);
            }}
          />
          {hasPhoto ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex items-center gap-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-4"
            >
              <div className="relative shrink-0">
                <Image
                  src={wizard.photoPreviewUrl}
                  alt="Качена снимка"
                  width={88}
                  height={88}
                  unoptimized
                  className="size-22 rounded-xl object-cover shadow-md"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Премахни снимката"
                  className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="min-w-0">
        <p className="font-bold text-primary">Снимката е готова ✓</p>
                {subject.max > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Ако на снимката има още някой — добави го по-долу.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-1 text-sm font-semibold text-primary hover:underline"
                >
                  Смени снимката
                </button>
                {[...photoWarnings, ...(countWarning ? [countWarning] : [])].map((w) => (
                  <p
                    key={w}
                    className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void handlePhoto(f);
              }}
              className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-9 text-center transition-all ${
                dragActive
                  ? "scale-[1.01] border-primary bg-primary/10"
                  : "border-border bg-card/60 hover:border-primary/50 hover:bg-card"
              }`}
            >
              <motion.span
                animate={dragActive ? { y: [-2, -8, -2] } : { y: 0 }}
                transition={{ duration: 0.8, repeat: dragActive ? Infinity : 0 }}
                className="grid size-14 place-items-center rounded-xl bg-secondary text-foreground/70 shadow-inner"
              >
                {uploading ? (
                  <Loader2 className="size-7 animate-spin" />
                ) : (
                  <UploadCloud className="size-7" />
                )}
              </motion.span>
              <div>
        <p className="font-bold">
                  {uploading
                    ? "Качваме снимката..."
                    : dragActive
                      ? "Пусни снимката тук"
                      : "Провлачи снимка тук или кликни"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  JPG, PNG или HEIC (iPhone) до 8 MB
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Subjects */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {wizard.subjects.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border-2 border-border bg-card/60 p-5"
              >
                <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-bold">
                    <span className="grid size-7 place-items-center rounded-full bg-secondary text-foreground/70">
                      <SubjectIcon template={template} />
                    </span>
                    {multi ? `№ ${idx + 1}` : template.name}
                  </span>
                  {wizard.subjects.length > subject.min && (
                    <button
                      type="button"
                      onClick={() => wizard.removeSubject(s.id)}
                      aria-label="Премахни"
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Sparkle className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/50" />
                    <Input
                      placeholder={`Име на ${subject.noun}`}
                      className="h-12 rounded-xl border-2 pl-11"
                      value={s.name}
                      onChange={(e) => wizard.updateSubject(s.id, { name: e.target.value })}
                    />
                  </div>

                  {subject.species !== "none" && (
                    <div className="relative">
                      <PawPrint className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/50" />
                      <Input
                        placeholder="Вид или порода — напр. лабрадор, сиамска котка"
                        className="h-12 rounded-xl border-2 pl-11"
                        value={s.species}
                        onChange={(e) =>
                          wizard.updateSubject(s.id, { species: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {subject.relation !== "none" && (
                    <div className="relative">
                      <Heart className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/50" />
                      <Input
                        placeholder="Какъв ти е (по избор) — напр. колежка, учител"
                        className="h-12 rounded-xl border-2 pl-11"
                        value={s.relation}
                        onChange={(e) =>
                          wizard.updateSubject(s.id, { relation: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {(subject.age !== "none" || subject.gender !== "none") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {subject.age !== "none" && (
                        <div className="relative">
                          <Cake className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-primary/50" />
                          <Select
                            value={s.age}
                            onValueChange={(v) => wizard.updateSubject(s.id, { age: v })}
                          >
                            <SelectTrigger className="!h-12 w-full whitespace-nowrap rounded-xl border-2 pl-11 [&>span]:truncate">
                              <SelectValue
                                placeholder={
                                  subject.age === "optional"
                                    ? "Възраст (по избор)"
                                    : "Възраст"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {AGE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {subject.gender !== "none" && (
                        <div className="grid grid-cols-2 gap-2">
                          {(["MALE", "FEMALE"] as const).map((g, gi) => {
                            const active = s.gender === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => wizard.updateSubject(s.id, { gender: g })}
                                className={`group relative h-12 overflow-hidden rounded-xl border-2 text-sm font-semibold transition-all ${
                                  active
                                    ? "border-primary shadow-md shadow-primary/15"
                                    : "border-border bg-card hover:border-primary/40"
                                }`}
                              >
                                {/* One accent for whichever side is picked. Blue
                                    for the man and pink for the woman was the
                                    last piece of nursery colour-coding in the
                                    form, and it never carried any meaning. */}
                                {active && <span className="absolute inset-0 bg-primary/12" />}
                                <span className="relative flex items-center justify-center gap-1">
                                  <SubjectIcon template={template} />
                                  {subject.genderLabels[gi]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {subject.addLabel && wizard.subjects.length < subject.max && (
            <button
              type="button"
              onClick={() => wizard.addSubject()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-3 font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Plus className="size-5" /> {subject.addLabel}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => wizard.setStep(TEMPLATE_STEP)}
          >
            <ArrowLeft className="size-4" /> Назад
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={next}
            disabled={uploading}
            className="group h-14 flex-1 rounded-lg text-base shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01]"
          >
            Продължи
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

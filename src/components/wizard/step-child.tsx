"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Baby,
  Cake,
  Camera,
  Loader2,
  Lock,
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
import { MAX_CHILDREN, useWizard } from "@/lib/store/wizard";

const GENDERS = [
  { id: "BOY", label: "Момче", ring: "from-sky to-mint" },
  { id: "GIRL", label: "Момиче", ring: "from-blush to-lavender" },
] as const;

// Preset ages (halves for toddlers, whole after 6) — easy to pick on mobile.
const AGE_OPTIONS: { value: string; label: string }[] = (() => {
  const out: { value: string; label: string }[] = [];
  for (let a = 0.5; a <= 6; a += 0.5) out.push({ value: String(a), label: `${a} г.` });
  for (let a = 7; a <= 18; a++) out.push({ value: String(a), label: `${a} г.` });
  return out;
})();

export function StepChild() {
  const wizard = useWizard();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [photoWarnings, setPhotoWarnings] = useState<string[]>([]);

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
      }>("/api/upload", { method: "POST", body });
      if (!ok) throw new Error(error ?? "Качването не успя");
      wizard.setPhoto(data.key, data.previewUrl);
      // Quality warnings are advisory — the parent may have only this one photo,
      // so we flag the risk and let them decide rather than blocking.
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
    if (fileInput.current) fileInput.current.value = "";
  }

  function next() {
    if (!wizard.photoKey) {
      toast.error("Качи снимка");
      return;
    }
    for (const c of wizard.children) {
      if (c.name.trim().length < 2) {
        toast.error("Въведи име на всяко дете");
        return;
      }
      if (c.age === "" || Number.isNaN(Number(c.age))) {
        toast.error(`Въведи възраст на ${c.name || "детето"}`);
        return;
      }
      if (!c.gender) {
        toast.error(`Избери пол на ${c.name || "детето"}`);
        return;
      }
    }
    wizard.setStep(1);
  }

  const hasPhoto = Boolean(wizard.photoKey && wizard.photoPreviewUrl);

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-none">
      <CardContent className="space-y-7 p-8">
        {/* Photo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-base">
            <span className="grid size-7 place-items-center rounded-full bg-mint/70 text-foreground/70">
              <Camera className="size-4" />
            </span>
            Снимка на детето/децата
          </Label>

          {/* Photo guidance — input quality is the single biggest factor in how
              much the illustration ends up looking like the real child. */}
          <div className="rounded-2xl bg-secondary/50 px-4 py-3">
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
                Избягвай тъмни, размазани и силно филтрирани снимки, слънчеви очила и
                шапки над очите. Няколко деца на една снимка е напълно наред — просто
                добави всяко от тях по-долу.
              </span>
            </p>
          </div>

          {/* The upload button is exactly where a parent hesitates — answer the
              privacy question here, not three sections down in the FAQ. */}
          <p className="flex items-start gap-1.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
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
              className="relative flex items-center gap-4 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4"
            >
              <div className="relative shrink-0">
                <Image
                  src={wizard.photoPreviewUrl}
                  alt="Качена снимка"
                  width={88}
                  height={88}
                  unoptimized
                  className="size-22 rounded-2xl object-cover shadow-md"
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
                <p className="font-heading font-bold text-primary">Снимката е готова ✓</p>
                <p className="text-sm text-muted-foreground">
                  Ако на снимката има братче/сестриче — добави ги по-долу.
                </p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-1 text-sm font-semibold text-primary hover:underline"
                >
                  Смени снимката
                </button>
                {photoWarnings.map((w) => (
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
              className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-all ${
                dragActive
                  ? "scale-[1.01] border-primary bg-primary/10"
                  : "border-border bg-card/60 hover:border-primary/50 hover:bg-card"
              }`}
            >
              <motion.span
                animate={dragActive ? { y: [-2, -8, -2] } : { y: 0 }}
                transition={{ duration: 0.8, repeat: dragActive ? Infinity : 0 }}
                className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sky to-lavender text-foreground/70 shadow-inner"
              >
                {uploading ? (
                  <Loader2 className="size-7 animate-spin" />
                ) : (
                  <UploadCloud className="size-7" />
                )}
              </motion.span>
              <div>
                <p className="font-heading font-bold">
                  {uploading
                    ? "Качваме снимката..."
                    : dragActive
                      ? "Пусни снимката тук"
                      : "Провлачи снимка тук или кликни"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  JPG, PNG или HEIC (iPhone) до 8 MB · може и снимка с няколко деца
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Children */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {wizard.children.map((child, idx) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border-2 border-border bg-card/60 p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-heading font-bold">
                    <span className="grid size-7 place-items-center rounded-full bg-blush/70 text-foreground/70">
                      <User className="size-4" />
                    </span>
                    {wizard.children.length > 1 ? `Дете ${idx + 1}` : "Детето"}
                  </span>
                  {wizard.children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => wizard.removeChild(child.id)}
                      aria-label="Премахни дете"
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
                      placeholder="Име на детето"
                      className="h-12 rounded-2xl border-2 pl-11"
                      value={child.name}
                      onChange={(e) => wizard.updateChild(child.id, { name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <Cake className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-primary/50" />
                      <Select
                        value={child.age}
                        onValueChange={(v) => wizard.updateChild(child.id, { age: v })}
                      >
                        <SelectTrigger className="!h-12 w-full whitespace-nowrap rounded-2xl border-2 pl-11 [&>span]:truncate">
                          <SelectValue placeholder="Възраст" />
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
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map((g) => {
                        const active = child.gender === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => wizard.updateChild(child.id, { gender: g.id })}
                            className={`group relative h-12 overflow-hidden rounded-2xl border-2 text-sm font-semibold transition-all ${
                              active
                                ? "border-primary shadow-md shadow-primary/15"
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            {active && (
                              <span
                                className={`absolute inset-0 bg-gradient-to-br ${g.ring} opacity-40`}
                              />
                            )}
                            <span className="relative flex items-center justify-center gap-1">
                              <Baby className="size-4" />
                              {g.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {wizard.children.length < MAX_CHILDREN && (
            <button
              type="button"
              onClick={() => wizard.addChild()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-3 font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Plus className="size-5" /> Добави още дете (братче / сестриче)
            </button>
          )}
        </div>

        <Button
          type="button"
          size="lg"
          onClick={next}
          disabled={uploading}
          className="group h-14 w-full rounded-full text-base shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01]"
        >
          Продължи към думичките
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

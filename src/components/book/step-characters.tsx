"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import {
  MAX_CHARACTERS,
  MIN_CHARACTERS,
} from "@/lib/books/catalog";
import {
  useBookWizard,
  type BookCharacterDraft,
} from "@/lib/store/book-wizard";

/**
 * Who the book is about.
 *
 * The long free-text box matters more than the tidy fields beside it. "Мартин е
 * на 5. Обича динозаври и понякога се страхува от тъмното, но винаги пази
 * сестра си" gives the story something to be ABOUT; a dropdown for favourite
 * animal does not. So the box is large and given an example, and the structured
 * fields are optional.
 */
export function StepCharacters() {
  const characters = useBookWizard((s) => s.characters);
  const add = useBookWizard((s) => s.addCharacter);

  return (
    <div className="space-y-5">
      {characters.map((c, i) => (
        <CharacterCard key={c.id} character={c} index={i} />
      ))}

      {characters.length < MAX_CHARACTERS && (
        <button
          type="button"
          onClick={add}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/25 text-sm font-medium text-foreground/75 transition-colors hover:border-foreground/45 hover:bg-muted"
        >
          <Plus className="size-4" strokeWidth={1.5} /> Добави още едно дете
        </button>
      )}
    </div>
  );
}

function CharacterCard({
  character: c,
  index,
}: {
  character: BookCharacterDraft;
  index: number;
}) {
  const update = useBookWizard((s) => s.updateCharacter);
  const remove = useBookWizard((s) => s.removeCharacter);
  const count = useBookWizard((s) => s.characters.length);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      // A face is genuinely required here — the whole book is drawn from it —
      // so this uses the default "poster" purpose and keeps the face check.
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as {
        key?: string;
        previewUrl?: string;
        error?: string;
        warnings?: string[];
      };
      if (!res.ok || !data.key) throw new Error(data.error ?? "Качването не успя");
      update(c.id, { photoKey: data.key, photoPreviewUrl: data.previewUrl ?? "" });
      data.warnings?.forEach((w) => toast.warning(w));
      toast.success("Снимката е готова");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Качването не успя");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl bg-sand p-5 ring-1 ring-border sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Дете {index + 1}</p>
        {count > MIN_CHARACTERS && (
          <button
            type="button"
            onClick={() => remove(c.id)}
            aria-label={`Премахни дете ${index + 1}`}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-40">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-foreground/25 bg-background transition-colors hover:border-foreground/45 disabled:opacity-60"
          >
            {c.photoPreviewUrl ? (
              <Image src={c.photoPreviewUrl} alt="" fill sizes="160px" className="object-cover" unoptimized />
            ) : uploading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                <ImagePlus className="size-5" strokeWidth={1.5} />
                Качи снимка
              </span>
            )}
          </button>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Ясно лице, отблизо
          </p>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_5rem_auto]">
            <Field
              label="Име"
              value={c.name}
              onChange={(v) => update(c.id, { name: v })}
              placeholder="Мартин"
            />
            <Field
              label="Възраст"
              value={c.age}
              onChange={(v) => update(c.id, { age: v.replace(/[^\d]/g, "").slice(0, 2) })}
              placeholder="5"
              inputMode="numeric"
            />
            <div>
              <span className="text-xs font-medium text-muted-foreground">Пол</span>
              <div className="mt-1.5 flex gap-1.5">
                {([["BOY", "Момче"], ["GIRL", "Момиче"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => update(c.id, { gender: c.gender === v ? "" : v })}
                    aria-pressed={c.gender === v}
                    className={`h-10 rounded-lg border px-3 text-sm transition-colors ${
                      c.gender === v
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Разкажете ни малко за детето
            </label>
            <textarea
              value={c.description}
              onChange={(e) => update(c.id, { description: e.target.value.slice(0, 600) })}
              rows={4}
              placeholder="Мартин е на 5 години. Обича динозаври, коли и да играе навън. Понякога се страхува от тъмното, но винаги пази малката си сестра."
              className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Колкото повече ни кажеш, толкова повече историята е за него.{" "}
              {c.description.length} / 600
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Любими занимания" value={c.interests} onChange={(v) => update(c.id, { interests: v })} placeholder="динозаври, коли" />
            <Field label="Любима играчка" value={c.favouriteToy} onChange={(v) => update(c.id, { favouriteToy: v })} placeholder="плюшен тигър" />
            <Field label="Любимо животно" value={c.favouriteAnimal} onChange={(v) => update(c.id, { favouriteAnimal: v })} placeholder="слон" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  /** Takes the value, not the event — the caller never wants the target. */
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
        {...rest}
      />
    </div>
  );
}

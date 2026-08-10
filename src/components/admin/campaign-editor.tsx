"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, ChevronDown, Loader2, Plus, Power, Send, Trash2 } from "lucide-react";
import { TEMPLATES, TEMPLATE_ORDER } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  broadcastCampaign,
  deleteCampaign,
  saveCampaign,
  toggleCampaign,
  type CampaignState,
} from "@/app/actions/campaigns";

export interface CampaignRow {
  id: string;
  name: string;
  enabled: boolean;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  priority: number;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBadge: string | null;
  promoText: string | null;
  promoSecondary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  accentColor: string | null;
  template: string | null;
  auraColor: string | null;
  isActiveNow: boolean;
}

function useToast(state: CampaignState) {
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
}

export function CampaignList({ campaigns }: { campaigns: CampaignRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      {campaigns.map((c) => (
        <CampaignCard key={c.id} campaign={c} />
      ))}

      {creating ? (
        <CampaignCard onDone={() => setCreating(false)} />
      ) : (
        <Button onClick={() => setCreating(true)} variant="outline" className="rounded-full">
          <Plus className="size-4" /> Нова кампания
        </Button>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  onDone,
}: {
  campaign?: CampaignRow;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(!campaign);
  const [saveState, saveAction, saving] = useActionState(saveCampaign, {});
  const [toggleState, toggleAction] = useActionState(toggleCampaign, {});
  const [delState, delAction] = useActionState(deleteCampaign, {});
  const [castState, castAction, casting] = useActionState(broadcastCampaign, {});

  useToast(saveState);
  useToast(toggleState);
  useToast(delState);
  useToast(castState);

  useEffect(() => {
    if (saveState.ok && onDone) onDone();
  }, [saveState.ok, onDone]);

  const window = campaign
    ? `${campaign.startDay}.${campaign.startMonth} → ${campaign.endDay}.${campaign.endMonth}`
    : "";

  return (
    <div
      className={`glass rounded-3xl p-6 ${
        campaign?.isActiveNow ? "ring-2 ring-primary" : ""
      }`}
    >
      {campaign && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <ChevronDown
              className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            />
            <span className="font-heading font-bold">{campaign.name}</span>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="size-3.5" /> {window}
            </span>
            {campaign.isActiveNow && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                активна сега
              </span>
            )}
            {!campaign.enabled && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                изключена
              </span>
            )}
          </button>

          <form action={castAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="rounded-full"
              title="Изпрати имейл до клиентите, дали съгласие"
            >
              {casting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Разпрати
            </Button>
          </form>

          <form action={toggleAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <Button type="submit" variant="ghost" size="icon" title="Включи/изключи">
              <Power className={`size-4 ${campaign.enabled ? "text-emerald-600" : ""}`} />
            </Button>
          </form>
          <form action={delAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              title="Изтрий"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </form>
        </div>
      )}

      {open && (
        <form action={saveAction} className={campaign ? "mt-6 space-y-5" : "space-y-5"}>
          {campaign && <input type="hidden" name="id" value={campaign.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Име (само за теб)" name="name" defaultValue={campaign?.name} required />
            <div className="flex items-end gap-3">
              <Field
                label="Приоритет"
                name="priority"
                type="number"
                defaultValue={String(campaign?.priority ?? 0)}
                hint="По-високото печели при застъпване"
              />
              <label className="flex h-11 items-center gap-2 whitespace-nowrap text-sm font-semibold">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={campaign?.enabled ?? true}
                  className="size-4 accent-[var(--primary)]"
                />
                Включена
              </label>
            </div>
          </div>

          {/* Which poster this occasion sells. The hero CTA carries it into the
              wizard, so an "подарък за колежка" campaign never drops the visitor
              onto a form asking for a child's age. */}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Вид постер за този повод</span>
            <select
              name="template"
              defaultValue={campaign?.template ?? ""}
              className="h-11 w-full rounded-xl border-2 border-border bg-card px-3 text-sm"
            >
              <option value="">Без — посетителят избира сам</option>
              {TEMPLATE_ORDER.map((id) => (
                <option key={id} value={id}>
                  {TEMPLATES[id].name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="grid grid-cols-4 gap-3">
            <legend className="mb-2 text-sm font-semibold">
              Период (повтаря се всяка година)
            </legend>
            <Field label="От ден" name="startDay" type="number" defaultValue={String(campaign?.startDay ?? 1)} />
            <Field label="От месец" name="startMonth" type="number" defaultValue={String(campaign?.startMonth ?? 1)} />
            <Field label="До ден" name="endDay" type="number" defaultValue={String(campaign?.endDay ?? 1)} />
            <Field label="До месец" name="endMonth" type="number" defaultValue={String(campaign?.endMonth ?? 1)} />
          </fieldset>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-sm font-semibold">Текстове на сайта (празно = без промяна)</p>
            <Field label="Етикет над заглавието" name="heroBadge" defaultValue={campaign?.heroBadge ?? ""} />
            <Field label="Заглавие" name="heroTitle" defaultValue={campaign?.heroTitle ?? ""} />
            <Field label="Подзаглавие" name="heroSubtitle" defaultValue={campaign?.heroSubtitle ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Лента горе" name="promoText" defaultValue={campaign?.promoText ?? ""} />
              <Field label="Лента горе — второ" name="promoSecondary" defaultValue={campaign?.promoSecondary ?? ""} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-sm font-semibold">SEO и цветове</p>
            <Field label="SEO заглавие" name="seoTitle" defaultValue={campaign?.seoTitle ?? ""} />
            <Field label="SEO описание" name="seoDescription" defaultValue={campaign?.seoDescription ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Основен цвят"
                name="accentColor"
                defaultValue={campaign?.accentColor ?? ""}
                hint="напр. oklch(0.68 0.16 350)"
              />
              <Field
                label="Цвят на фона"
                name="auraColor"
                defaultValue={campaign?.auraColor ?? ""}
                hint="напр. oklch(0.9 0.06 350)"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving && <Loader2 className="size-4 animate-spin" />} Запази
            </Button>
            {onDone && (
              <Button type="button" variant="ghost" onClick={onDone} className="rounded-full">
                Откажи
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="h-11 rounded-xl"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

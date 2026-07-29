"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings, type AdminState } from "@/app/actions/admin-extra";
import type { SiteSettings } from "@/lib/settings";

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:border-primary/40">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-5 accent-current text-primary"
      />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateSettings, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      <section className="glass space-y-5 rounded-3xl p-7">
        <h2 className="font-heading text-lg font-bold">Промо лента</h2>
        <Toggle
          name="promoEnabled"
          label="Показвай промо лентата"
          hint="Тънката цветна лента най-горе на сайта."
          defaultChecked={settings.promoEnabled}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="promoText">Основен текст</Label>
            <Input
              id="promoText"
              name="promoText"
              defaultValue={settings.promoText}
              className="h-12 rounded-2xl border-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promoSecondary">Втори текст</Label>
            <Input
              id="promoSecondary"
              name="promoSecondary"
              defaultValue={settings.promoSecondary}
              className="h-12 rounded-2xl border-2"
            />
          </div>
        </div>
      </section>

      <section className="glass space-y-5 rounded-3xl p-7">
        <h2 className="font-heading text-lg font-bold">Начална страница</h2>
        <div className="space-y-2">
          <Label htmlFor="heroTitle">Заглавие</Label>
          <Input
            id="heroTitle"
            name="heroTitle"
            defaultValue={settings.heroTitle}
            className="h-12 rounded-2xl border-2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heroSubtitle">Подзаглавие</Label>
          <Textarea
            id="heroSubtitle"
            name="heroSubtitle"
            rows={3}
            defaultValue={settings.heroSubtitle}
            className="rounded-2xl border-2"
          />
        </div>
      </section>

      <section className="glass space-y-5 rounded-3xl p-7">
        <h2 className="font-heading text-lg font-bold">Отзиви</h2>
        <Toggle
          name="showReviews"
          label="Показвай секцията с отзиви"
          hint="Показват се само одобрените отзиви."
          defaultChecked={settings.showReviews}
        />
        <div className="space-y-2">
          <Label htmlFor="reviewsHeading">Заглавие на секцията</Label>
          <Input
            id="reviewsHeading"
            name="reviewsHeading"
            defaultValue={settings.reviewsHeading}
            className="h-12 rounded-2xl border-2"
          />
        </div>
      </section>

      <section className="glass space-y-5 rounded-3xl p-7">
        <h2 className="font-heading text-lg font-bold">Контакт и доставка</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Имейл</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail}
              className="h-12 rounded-2xl border-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Телефон</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              defaultValue={settings.contactPhone}
              className="h-12 rounded-2xl border-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDays">Срок за доставка</Label>
            <Input
              id="deliveryDays"
              name="deliveryDays"
              defaultValue={settings.deliveryDays}
              className="h-12 rounded-2xl border-2"
            />
          </div>
        </div>
      </section>

      <section className="glass space-y-5 rounded-3xl p-7">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <Sparkles className="size-5 text-primary" />
            AI и разходи
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Всяко генериране на постер струва пари. Тук решаваш колко.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiQuality">Качество на рисунката</Label>
          <select
            id="aiQuality"
            name="aiQuality"
            defaultValue={settings.aiQuality}
            className="h-12 w-full rounded-2xl border-2 border-border bg-card px-4 font-medium outline-none focus:border-primary"
          >
            <option value="low">Ниско — най-евтино (~0.02 €), за бързи проби</option>
            <option value="medium">Средно — препоръчано (~0.05 €), изглежда чудесно на екран</option>
            <option value="high">Високо — най-скъпо (~0.17 €), максимална детайлност за печат</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Прегледът, който клиентът вижда, е умалèн и с воден знак — за проби
            „средно“ е напълно достатъчно. Превключи на „високо“, когато вече
            приемаш реални поръчки за печат.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiDailyLimit">Дневен лимит генерирания</Label>
          <Input
            id="aiDailyLimit"
            name="aiDailyLimit"
            type="number"
            min={0}
            defaultValue={settings.aiDailyLimit}
            className="h-12 rounded-2xl border-2 sm:max-w-40"
          />
          <p className="text-sm text-muted-foreground">
            Спира генерирането след този брой за деня — предпазва бюджета при
            грешка или бот. <strong>0</strong> означава без лимит. Важи и в тестов режим.
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-13 rounded-full px-8 shadow-lg shadow-primary/25"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Запазваме...
            </>
          ) : (
            <>
              <Save className="size-5" /> Запази промените
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

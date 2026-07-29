"use client";

import { useActionState } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupOrder, type TrackResult } from "@/app/actions/track";

/** Customer-facing status labels — the DB enum names never reach the page. */
const STATUS_LABELS: Record<string, { title: string; text: string }> = {
  CREATED: { title: "Получена", text: "Поръчката е при нас." },
  GENERATING: { title: "Изработва се", text: "Илюстрацията се създава." },
  PREVIEW_READY: {
    title: "Чака довършване",
    text: "Постерът е готов, но поръчката не е финализирана.",
  },
  CONFIRMED: { title: "Потвърдена", text: "Подготвяме постера за печат." },
  PRINTING: { title: "В печат", text: "Постерът се отпечатва в момента." },
  SHIPPED: { title: "Изпратена", text: "Пратката пътува към теб." },
  DELIVERED: { title: "Доставена", text: "Пратката е получена. Приятни спомени! ❤️" },
  CANCELLED: { title: "Отменена", text: "Поръчката е отменена." },
};

export function TrackForm({ defaultOrderNumber }: { defaultOrderNumber?: string }) {
  const [state, action, pending] = useActionState<TrackResult, FormData>(lookupOrder, {});
  const status = state.order ? STATUS_LABELS[state.order.status] : null;

  return (
    <div className="mx-auto w-full max-w-lg">
      <form action={action} className="glass space-y-5 rounded-3xl p-7">
        <div className="space-y-2">
          <Label htmlFor="orderNumber">Номер на поръчка</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            inputMode="numeric"
            defaultValue={defaultOrderNumber}
            placeholder="напр. 128"
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон от поръчката</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="0888 123 456"
            className="h-12 rounded-2xl"
          />
        </div>

        {state.error && (
          <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-13 w-full rounded-full text-base"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Проверяваме...
            </>
          ) : (
            <>
              <PackageSearch className="size-5" /> Провери поръчката
            </>
          )}
        </Button>
      </form>

      {state.order && status && (
        <div className="glass mt-6 rounded-3xl p-7">
          <p className="text-sm text-muted-foreground">
            Поръчка №{state.order.orderNumber} · {state.order.childName}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-extrabold">{status.title}</h2>
          <p className="mt-1 text-muted-foreground">{status.text}</p>

          <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
            {state.order.trackingNumber && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Товарителница ({state.order.courier === "SPEEDY" ? "Спиди" : "Еконт"})
                </dt>
                <dd className="font-semibold">{state.order.trackingNumber}</dd>
              </div>
            )}
            {state.order.total && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">За плащане на куриера</dt>
                <dd className="font-heading text-base font-extrabold">
                  {state.order.total}
                </dd>
              </div>
            )}
          </dl>

          {!state.order.confirmed && state.order.status === "CONFIRMED" && (
            <p className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm">
              Чакаме твоето потвърждение от имейла, преди да пуснем постера за печат.
              Провери пощата си (и папка „Спам“).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

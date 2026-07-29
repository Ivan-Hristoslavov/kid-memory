"use client";

import { useActionState, useEffect, useState } from "react";
import { ProtectedImage } from "@/components/shared/protected-image";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { confirmOrder, type CheckoutFormState } from "@/app/actions/checkout";
import {
  ADDONS,
  AVAILABLE_PRODUCTS,
  COURIERS,
  addonPriceEUR,
  DELIVERY,
  DELIVERY_METHODS,
  PRODUCTS,
  availableAddons,
  calcDeliveryEUR,
  calcTotalEUR,
  formatPrice,
  type AddonId,
  type ProductId,
} from "@/lib/catalog";
import { Copy, Frame, Gift, Layers } from "lucide-react";

const ADDON_ICONS = { Frame, Layers, Gift, Copy } as const;

interface Office {
  id: string;
  name: string;
  address: string;
}

export function CheckoutForm({
  orderId,
  childName,
  previewUrl,
}: {
  orderId: string;
  childName: string;
  previewUrl: string | null;
}) {
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(
    confirmOrder,
    {}
  );

  const defaultProduct: ProductId = AVAILABLE_PRODUCTS.includes("POSTER_A3")
    ? "POSTER_A3"
    : AVAILABLE_PRODUCTS[0];
  const [product, setProduct] = useState<ProductId>(defaultProduct);
  const [courier, setCourier] = useState<string>("ECONT");
  const [delivery, setDelivery] = useState<string>("OFFICE");
  const [city, setCity] = useState("");
  const [addons, setAddons] = useState<AddonId[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [officesLoading, setOfficesLoading] = useState(false);

  const isDigital = product === "DIGITAL";
  const needsOffice = !isDigital && (delivery === "OFFICE" || delivery === "LOCKER");
  const offeredAddons = availableAddons(product);
  const activeAddons = addons.filter((id) => offeredAddons.includes(id));
  const subtotal = calcTotalEUR(product, activeAddons);
  const deliveryFee = calcDeliveryEUR(product, subtotal);
  const total = subtotal + deliveryFee;
  // Nudge toward the free-delivery threshold — cheapest way to lift AOV.
  const missingForFreeDelivery = isDigital
    ? 0
    : Math.max(0, Math.round((DELIVERY.freeAboveEUR - subtotal) * 100) / 100);

  useEffect(() => {
    if (!needsOffice || city.trim().length < 2) {
      setOffices([]);
      return;
    }
    const timer = setTimeout(async () => {
      setOfficesLoading(true);
      try {
        const params = new URLSearchParams({
          courier,
          city: city.trim(),
          kind: delivery === "LOCKER" ? "LOCKER" : "OFFICE",
        });
        const res = await fetch(`/api/couriers/offices?${params}`);
        const json = await res.json();
        setOffices(json.offices ?? []);
      } catch {
        setOffices([]);
      } finally {
        setOfficesLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [city, courier, delivery, needsOffice]);

  const err = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={action} className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="orderId" value={orderId} />

      <div className="space-y-8">
        {/* Product selection */}
        <section className="glass rounded-3xl p-7">
          <h2 className="font-heading text-xl font-bold">Избери продукт</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {AVAILABLE_PRODUCTS.map((id) => {
              const p = PRODUCTS[id];
              const selected = product === id;
              return (
                <label
                  key={id}
                  className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="productType"
                    value={id}
                    checked={selected}
                    onChange={() => setProduct(id)}
                    className="sr-only"
                  />
                  {selected && (
                    <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  <p className="font-heading font-bold">{p.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  <p className="mt-2 font-heading text-2xl font-extrabold">
                    {formatPrice(p.priceEUR)}
                  </p>
                </label>
              );
            })}
          </div>
        </section>

        {/* Customer details */}
        <section className="glass rounded-3xl p-7">
          <h2 className="font-heading text-xl font-bold">Твоите данни</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customerName">Име и фамилия</Label>
              <Input
                id="customerName"
                name="customerName"
                className="h-12 rounded-2xl"
                placeholder="напр. Мария Иванова"
              />
              {err("customerName") && (
                <p className="text-sm text-destructive">{err("customerName")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                className="h-12 rounded-2xl"
                placeholder="0888 123 456"
              />
              {err("phone") && <p className="text-sm text-destructive">{err("phone")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="h-12 rounded-2xl"
                placeholder="maria@example.com"
              />
              {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
            </div>
          </div>
        </section>

        {/* Delivery */}
        {!isDigital && (
          <section className="glass rounded-3xl p-7">
            <h2 className="font-heading text-xl font-bold">Доставка</h2>

            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <Label>Куриер</Label>
                <RadioGroup
                  name="courier"
                  value={courier}
                  onValueChange={setCourier}
                  className="grid grid-cols-2 gap-3"
                >
                  {COURIERS.map((c) => (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                        courier === c.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={c.id} id={`courier-${c.id}`} />
                      <span className="font-semibold">{c.name}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Начин на доставка</Label>
                <RadioGroup
                  name="deliveryMethod"
                  value={delivery}
                  onValueChange={setDelivery}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {DELIVERY_METHODS.map((d) => (
                    <label
                      key={d.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                        delivery === d.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={d.id} id={`delivery-${d.id}`} />
                      <span className="text-sm font-semibold">{d.name}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Град</Label>
                <Input
                  id="city"
                  name="city"
                  className="h-12 rounded-2xl"
                  placeholder="напр. София"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                {err("city") && <p className="text-sm text-destructive">{err("city")}</p>}
              </div>

              {delivery === "ADDRESS" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    name="address"
                    className="h-12 rounded-2xl"
                    placeholder="ул., №, вход, етаж, апартамент"
                  />
                  {err("address") && (
                    <p className="text-sm text-destructive">{err("address")}</p>
                  )}
                </div>
              )}

              {needsOffice && (
                <div className="space-y-2">
                  <Label htmlFor="courierOffice">
                    {delivery === "LOCKER" ? "Автомат" : "Офис"}
                    {officesLoading && (
                      <Loader2 className="ml-2 inline size-3.5 animate-spin" />
                    )}
                  </Label>
                  {offices.length > 0 ? (
                    <Select name="courierOffice">
                      <SelectTrigger className="h-12 w-full rounded-2xl">
                        <SelectValue placeholder="Избери от списъка" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((o) => (
                          <SelectItem key={o.id} value={`${o.id} — ${o.name}`}>
                            {o.name} · {o.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="courierOffice"
                      name="courierOffice"
                      className="h-12 rounded-2xl"
                      placeholder={
                        delivery === "LOCKER"
                          ? "напр. Еконтомат Младост 1"
                          : "напр. офис Люлин 7"
                      }
                    />
                  )}
                  {err("courierOffice") && (
                    <p className="text-sm text-destructive">{err("courierOffice")}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
        {/* Add-ons */}
        <section className="glass rounded-3xl p-7">
          <h2 className="font-heading text-xl font-bold">Направи го още по-специално</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Малки допълнения, които правят подаръка завършен.
          </p>
          <div className="mt-5 space-y-3">
            {offeredAddons.map((id) => {
              const a = ADDONS[id];
              const Icon = ADDON_ICONS[a.icon as keyof typeof ADDON_ICONS];
              const checked = activeAddons.includes(id);
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="addons"
                    value={id}
                    checked={checked}
                    onChange={(e) =>
                      setAddons((prev) =>
                        e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                      )
                    }
                    className="sr-only"
                  />
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${
                      checked ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading font-bold">{a.name}</span>
                    <span className="block text-sm text-muted-foreground">{a.description}</span>
                  </span>
                  <span className="shrink-0 font-heading font-bold">
                    +{formatPrice(addonPriceEUR(id, product))}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {isDigital && (
          <input type="hidden" name="city" value={city || "—"} />
        )}
        {isDigital && <input type="hidden" name="courier" value="ECONT" />}
        {isDigital && <input type="hidden" name="deliveryMethod" value="OFFICE" />}
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 h-fit space-y-5">
        <div className="glass overflow-hidden rounded-3xl">
          {previewUrl && (
            <ProtectedImage
              src={previewUrl}
              alt={`Защитен преглед на постера на ${childName}`}
              width={380}
              height={570}
            />
          )}
          <div className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{PRODUCTS[product].name}</span>
              <span className="font-semibold">
                {formatPrice(PRODUCTS[product].priceEUR)}
              </span>
            </div>
            {activeAddons.map((id) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ADDONS[id].name}</span>
                <span className="font-semibold">
                  +{formatPrice(addonPriceEUR(id, product))}
                </span>
              </div>
            ))}
            {!isDigital && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span className="font-semibold">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600">безплатна</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-heading text-lg font-bold">Общо</span>
              <span className="font-heading text-2xl font-extrabold">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Плащаш <strong className="text-foreground">{formatPrice(total)}</strong> на
              куриера при получаване. Няма скрити такси.
            </p>
            {missingForFreeDelivery > 0 && (
              <p className="rounded-2xl bg-secondary/60 p-3 text-center text-sm">
                Още {formatPrice(missingForFreeDelivery)} до безплатна доставка
              </p>
            )}
          </div>
        </div>

        {state.error && (
          <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {/* Personalised goods are excluded from the statutory right of
            withdrawal (чл. 57, т. 3 ЗЗП). Making the customer tick it here is
            both the legal record and a deliberate pause before a COD order. */}
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card/70 p-4 text-sm">
          <input
            type="checkbox"
            name="personalisedAck"
            required
            className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          />
          <span className="text-muted-foreground">
            Разбирам, че постерът се изработва специално за мен по моите данни и
            снимка, и затова не подлежи на връщане и замяна.
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-14 w-full rounded-full text-lg shadow-xl shadow-primary/30"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Изпращаме...
            </>
          ) : (
            "Потвърди поръчката ❤️"
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ще получиш имейл с потвърждение веднага след поръчката.
        </p>
      </aside>
    </form>
  );
}

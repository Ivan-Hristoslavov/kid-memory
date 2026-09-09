"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { placeShopOrder, type ShopCheckoutState } from "@/app/actions/shop-checkout";
import { ADDONS, DELIVERY, calcDeliveryEUR, formatPrice } from "@/lib/catalog";
import { cartSubtotalEUR, useCart, type CartLine } from "@/lib/store/cart";
import { productById } from "@/lib/shop/products";

/** Stable empty array — a fresh [] per call would loop useSyncExternalStore. */
const EMPTY: readonly CartLine[] = [];

/**
 * Catalogue checkout.
 *
 * The basket is posted as JSON in a hidden field and re-priced on the server;
 * the totals shown here are for the customer's benefit only. That split is the
 * point — the amount the courier collects is decided server-side from the
 * catalogue, so a hand-edited basket changes what is displayed and nothing
 * that is charged.
 */
export function MentyCheckoutForm({
  paymentMethods,
}: {
  paymentMethods: readonly ("COD" | "STRIPE")[];
}) {
  const lines = useSyncExternalStore(
    useCart.subscribe,
    () => useCart.getState().lines,
    () => EMPTY
  );
  const [state, action, pending] = useActionState<ShopCheckoutState, FormData>(
    placeShopOrder,
    {}
  );
  const [deliveryMethod, setDeliveryMethod] = useState<"OFFICE" | "ADDRESS" | "LOCKER">(
    "OFFICE"
  );

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-xl bg-sand p-12 text-center ring-1 ring-border">
        <p className="text-muted-foreground">Количката ти е празна.</p>
        <Link
          href="/produkti"
          className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Разгледай продуктите
        </Link>
      </div>
    );
  }

  const goods = cartSubtotalEUR(lines);
  const wrap = lines.reduce(
    (s, l) => (l.giftWrap ? s + ADDONS.GIFT_WRAP.priceEUR * l.quantity : s),
    0
  );
  const subtotal = Math.round((goods + wrap) * 100) / 100;
  const delivery = calcDeliveryEUR("POSTER_A4", subtotal);
  const total = Math.round((subtotal + delivery) * 100) / 100;

  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
      {/* The basket travels with the submission. The server treats it as input,
          never as an amount. */}
      <input
        type="hidden"
        name="cart"
        value={JSON.stringify(
          lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            variants: l.variants,
            photoKey: l.photoKey,
            text: l.text,
            giftWrap: l.giftWrap,
          }))
        )}
      />

      <div className="space-y-8">
        {state.error && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="font-heading text-lg font-bold">Твоите данни</legend>
          <Field name="customerName" label="Име и фамилия" error={err.customerName} autoComplete="name" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="phone" label="Телефон" error={err.phone} type="tel" autoComplete="tel" placeholder="0888 123 456" />
            <Field name="email" label="Имейл" error={err.email} type="email" autoComplete="email" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-heading text-lg font-bold">Доставка</legend>

          <div>
            <span className="text-sm font-medium">Куриер</span>
            <div className="mt-2 flex gap-2">
              {(["ECONT", "SPEEDY"] as const).map((c, i) => (
                <label
                  key={c}
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-foreground has-[:checked]:bg-muted"
                >
                  <input type="radio" name="courier" value={c} defaultChecked={i === 0} className="accent-forest" />
                  {c === "ECONT" ? "Еконт" : "Спиди"}
                </label>
              ))}
            </div>
            {err.courier && <Err>{err.courier}</Err>}
          </div>

          <div>
            <span className="text-sm font-medium">Начин на доставка</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["OFFICE", "До офис"],
                  ["LOCKER", "До автомат"],
                  ["ADDRESS", "До адрес"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-foreground has-[:checked]:bg-muted"
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={value}
                    checked={deliveryMethod === value}
                    onChange={() => setDeliveryMethod(value)}
                    className="accent-forest"
                  />
                  {label}
                </label>
              ))}
            </div>
            {err.deliveryMethod && <Err>{err.deliveryMethod}</Err>}
          </div>

          <Field name="city" label="Град" error={err.city} autoComplete="address-level2" />
          {deliveryMethod === "ADDRESS" ? (
            <Field name="address" label="Адрес" error={err.address} autoComplete="street-address" />
          ) : (
            <Field
              name="courierOffice"
              label={deliveryMethod === "LOCKER" ? "Автомат" : "Офис"}
              error={err.courierOffice}
              placeholder="напр. Офис Централен"
            />
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-heading text-lg font-bold">Плащане</legend>
          {paymentMethods.map((m, i) => (
            <label
              key={m}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-foreground has-[:checked]:bg-muted"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                defaultChecked={i === 0}
                className="mt-0.5 accent-forest"
              />
              <span>
                <span className="block text-sm font-semibold">
                  {m === "COD" ? "Наложен платеж" : "Плащане с карта"}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {m === "COD"
                    ? "Плащаш на куриера при получаване."
                    : "Плащаш сега, сигурно, през Stripe."}
                </span>
              </span>
            </label>
          ))}
          {err.paymentMethod && <Err>{err.paymentMethod}</Err>}

          <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm text-muted-foreground">
            <input type="checkbox" name="marketingOptIn" className="mt-0.5 accent-forest" />
            Искам да получавам идеи за подаръци по имейл. Може да се отпишеш по всяко време.
          </label>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl bg-sand p-6 ring-1 ring-border">
          <h2 className="font-heading text-lg font-bold">Поръчка</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => {
              const p = productById(l.productId);
              if (!p) return null;
              return (
                <li key={l.key} className="flex justify-between gap-3">
                  <span className="min-w-0 text-muted-foreground">
                    {l.quantity} × {p.title}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(Math.round(p.priceEUR * l.quantity * 100) / 100)}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            {wrap > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Подаръчна опаковка</dt>
                <dd className="font-medium">{formatPrice(wrap)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Доставка</dt>
              <dd className="font-medium">
                {delivery === 0 ? "Безплатна" : formatPrice(delivery)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <dt className="font-semibold">Общо</dt>
              <dd className="text-base font-semibold">{formatPrice(total)}</dd>
            </div>
          </dl>

          {delivery > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Безплатна доставка над {formatPrice(DELIVERY.freeAboveEUR)}.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Изпращаме…
              </>
            ) : (
              <>
                <Lock className="size-4" strokeWidth={1.5} /> Завърши поръчката
              </>
            )}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-destructive">{children}</p>;
}

function Field({
  name,
  label,
  error,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        className="mt-1.5 h-12 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40 aria-[invalid=true]:border-destructive"
        {...rest}
      />
      {error && <Err>{error}</Err>}
    </div>
  );
}

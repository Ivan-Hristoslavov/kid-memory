"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice, ADDONS } from "@/lib/catalog";
import { useCart } from "@/lib/store/cart";
import { designIdOf } from "@/lib/shop/ready";
import { textDesignById } from "@/lib/shop/text-designs";
import type { MentyProduct } from "@/lib/shop/products";
import { DesignedShirt } from "./designed-shirt";

/**
 * Buying a ready-made shirt.
 *
 * Deliberately not the personalisation panel with parts hidden. That panel is
 * an editor — upload, place, zoom, feather, choose a face — and every one of
 * those controls is a reason to leave for somebody who already knows they want
 * the shirt that says "Кумът". This is a size, a colour, a quantity and a
 * button.
 *
 * The one exception is a name. A lettering design with a `{name}` slot keeps a
 * single field, because "Кумът Мартин" is the version people pay more attention
 * to and it costs one input rather than an editor.
 */
export function ReadyShirtView({ product }: { product: MentyProduct }) {
  const add = useCart((s) => s.add);
  const designId = designIdOf(product.id) ?? "";
  const design = textDesignById(designId);
  const takesName = product.personalization.includes("TEXT");

  const colourAxis = product.variants.find((v) => v.swatch);
  const sizeAxis = product.variants.find((v) => !v.swatch);

  const [colour, setColour] = useState(colourAxis?.options[0] ?? "");
  const [size, setSize] = useState(sizeAxis?.options[0] ?? "");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);

  const hex = colourAxis?.swatch?.[colour] ?? "#1B1B1B";

  function onAdd() {
    const variants: Record<string, string> = {};
    if (colourAxis) variants[colourAxis.label] = colour;
    if (sizeAxis) variants[sizeAxis.label] = size;
    add({
      productId: product.id,
      quantity,
      variants,
      designId,
      text: name.trim() || undefined,
      giftWrap,
    });
    toast.success(`${product.title} е добавен в количката`);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      {/* White, to match the mock-up's own opaque surround — see the note in
          photo-placer. Sticky, because the whole point of a configurator is
          that the thing you are changing stays in sight while you change it. */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-xl bg-white p-3 ring-1 ring-border sm:p-5">
          <div className="mx-auto drop-shadow-[0_10px_24px_rgba(31,47,40,0.10)]">
            <DesignedShirt
              designId={designId}
              colorHex={hex}
              name={name}
              priority
            />
          </div>
        </div>
      </div>

      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {product.title}
        </h1>
        <p className="mt-3 text-muted-foreground">{product.blurb}</p>
        <p className="mt-5 text-2xl font-semibold text-foreground">
          {formatPrice(product.priceEUR)}
        </p>

        <div className="mt-6 rounded-lg bg-forest/8 px-3.5 py-3 text-xs text-forest">
          <span className="font-semibold">За цялата компания:</span> 4 броя −10%,
          6 броя −15%, 10 броя −20%. Смесвай размери, цветове и имена.
        </div>

        {colourAxis && (
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {colourAxis.label}
              </p>
              <p className="text-xs text-muted-foreground">{colour}</p>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {colourAxis.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setColour(opt)}
                  aria-pressed={colour === opt}
                  aria-label={opt}
                  title={opt}
                  className={`size-9 rounded-full ring-1 ring-inset ring-foreground/15 transition-[box-shadow] ${
                    colour === opt
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "hover:ring-foreground/40"
                  }`}
                  style={{ backgroundColor: colourAxis.swatch?.[opt] }}
                />
              ))}
            </div>
          </div>
        )}

        {sizeAxis && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-foreground">{sizeAxis.label}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {sizeAxis.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSize(opt)}
                  aria-pressed={size === opt}
                  className={`h-10 rounded-lg border px-4 text-sm font-medium transition-colors ${
                    size === opt
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground/80 hover:border-foreground/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {takesName && (
          <div className="mt-6">
            <label
              htmlFor="ready-name"
              className="text-sm font-semibold text-foreground"
            >
              Име{" "}
              <span className="font-normal text-muted-foreground">
                (по желание)
              </span>
            </label>
            <input
              id="ready-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              placeholder={design?.title ?? "Мартин"}
              className="mt-2 h-12 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground/40"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Появява се на тениската веднага, отляво.
            </p>
          </div>
        )}

        <label className="mt-6 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3.5">
          <span className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={giftWrap}
              onChange={(e) => setGiftWrap(e.target.checked)}
              className="size-4 accent-forest"
            />
            Подаръчна опаковка
          </span>
          <span className="text-sm text-muted-foreground">
            +{formatPrice(ADDONS.GIFT_WRAP.priceEUR)}
          </span>
        </label>

        <div className="mt-6 flex gap-3">
          <div className="flex h-12 items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="По-малко"
              className="grid size-11 place-items-center text-foreground/70 transition-colors hover:text-foreground"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label="Повече"
              className="grid size-11 place-items-center text-foreground/70 transition-colors hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-forest text-sm font-semibold text-ivory transition-colors hover:bg-forest/90"
          >
            <ShoppingBag className="size-4" strokeWidth={1.75} /> Добави в
            количката
          </button>
        </div>
      </div>
    </div>
  );
}

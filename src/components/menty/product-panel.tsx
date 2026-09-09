"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ImagePlus, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice, ADDONS } from "@/lib/catalog";
import { useCart } from "@/lib/store/cart";
import { PhotoPlacer } from "./photo-placer";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/shop/placement";
import type { MentyProduct } from "@/lib/shop/products";

/**
 * The purchase panel: variants, personalisation, quantity, add to basket.
 *
 * The brief's rule for this page is that personalisation must feel like part of
 * the product rather than an awkward form, and that controls appear only when
 * the actual source item supports them. So every block below is conditional on
 * `product.personalization` and `product.variants` — a metal keychain with no
 * colour axis simply has no colour row, rather than a disabled one.
 */
export function ProductPanel({ product }: { product: MentyProduct }) {
  const add = useCart((s) => s.add);
  const fileInput = useRef<HTMLInputElement>(null);

  // Each axis starts on its first real option, so the panel is never in a state
  // the catalogue does not describe.
  const [variants, setVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.variants.map((v) => [v.label, v.options[0]]))
  );
  const [photoKey, setPhotoKey] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoName, setPhotoName] = useState<string>("");
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const takesPhoto = product.personalization.includes("PHOTO");
  const takesText =
    product.personalization.includes("TEXT") ||
    product.personalization.includes("EMBROIDERY");

  async function onFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      // Printed as supplied, so it is not judged as a portrait: a pet, a
      // landscape or a shot from behind are all valid on a mug.
      form.append("purpose", "print");
      // The existing upload route already normalises, strips EXIF and refuses
      // unusable images, so a new product photo goes through exactly the same
      // door as a poster photo rather than a second, weaker one.
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as {
        key?: string;
        previewUrl?: string;
        error?: string;
        warnings?: string[];
      };
      if (!res.ok || !data.key) throw new Error(data.error ?? "Качването не успя");
      setPhotoKey(data.key);
      setPhotoUrl(data.previewUrl ?? "");
      setPhotoName(file.name);
      // A new photograph starts centred; keeping the previous crop would apply
      // one picture's framing to a different one.
      setPlacement(DEFAULT_PLACEMENT);
      data.warnings?.forEach((w) => toast.warning(w));
      toast.success("Снимката е готова");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Качването не успя");
    } finally {
      setUploading(false);
    }
  }

  function onAdd() {
    if (takesPhoto && !photoKey) {
      toast.error("Качи снимка, за да продължиш.");
      return;
    }
    add({
      productId: product.id,
      quantity,
      variants,
      photoKey: photoKey || undefined,
      placement: photoKey ? placement : undefined,
      text: text.trim() || undefined,
      giftWrap,
    });
    toast.success(`${product.title} е добавен в количката`);
  }

  const wrapPrice = ADDONS.GIFT_WRAP.priceEUR;

  return (
    <div className="space-y-6">
      {product.variants.map((axis) => (
        <div key={axis.label}>
          <p className="text-sm font-semibold text-foreground">{axis.label}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {axis.options.map((opt) => {
              const active = variants[axis.label] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVariants((v) => ({ ...v, [axis.label]: opt }))}
                  aria-pressed={active}
                  className={`h-10 rounded-lg border px-4 text-sm font-medium transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground/80 hover:border-foreground/40"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {takesPhoto && (
        <div>
          <p className="text-sm font-semibold text-foreground">Качи снимка</p>
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
            className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/25 bg-background text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/45 hover:bg-muted disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Качва се…
              </>
            ) : photoKey ? (
              <>
                <Check className="size-4 text-forest" /> {photoName || "Снимката е готова"}
              </>
            ) : (
              <>
                <ImagePlus className="size-4" strokeWidth={1.5} /> Избери снимка
              </>
            )}
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG или HEIC, до 8 MB</p>

          {photoKey && photoUrl && product.printArea && (
            <div className="mt-5">
              <PhotoPlacer
                product={product}
                photoUrl={photoUrl}
                placement={placement}
                onChange={setPlacement}
              />
            </div>
          )}
        </div>
      )}

      {takesText && (
        <div>
          <label htmlFor="menty-text" className="text-sm font-semibold text-foreground">
            Добави текст{" "}
            <span className="font-normal text-muted-foreground">(по желание)</span>
          </label>
          <input
            id="menty-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 60))}
            placeholder="Най-добрият татко на света"
            className="mt-2.5 h-12 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{text.length} / 60</p>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-4">
        <input
          type="checkbox"
          checked={giftWrap}
          onChange={(e) => setGiftWrap(e.target.checked)}
          className="size-4 accent-forest"
        />
        <span className="flex-1 text-sm font-medium text-foreground">
          Подаръчна опаковка
        </span>
        <span className="text-sm font-semibold text-foreground">
          +{formatPrice(wrapPrice)}
        </span>
      </label>

      <div className="flex gap-3">
        <div className="flex h-12 items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="По-малко"
            className="grid size-11 place-items-center text-foreground/70 transition-colors hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            aria-label="Повече"
            className="grid size-11 place-items-center text-foreground/70 transition-colors hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
        >
          <ShoppingBag className="size-4" strokeWidth={1.5} />
          Добави в количката
        </button>
      </div>
    </div>
  );
}

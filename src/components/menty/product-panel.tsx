"use client";

import { useSearchParams } from "next/navigation";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ImagePlus, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice, ADDONS } from "@/lib/catalog";
import { useCart } from "@/lib/store/cart";
import { PhotoPlacer } from "./photo-placer";
import { DesignPicker } from "./design-picker";
import { designById, designImage } from "@/lib/shop/designs";
import { textDesignById } from "@/lib/shop/text-designs";
import { TextDesignArt } from "./text-design-art";
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
  /**
   * Prefilled from `?design=`, so a design page can hand the choice over.
   *
   * Read once into initial state rather than watched: after the first render
   * the customer owns this control, and a later URL change should not reach in
   * and swap the design under their hands.
   */
  const initialDesign = useSearchParams().get("design") ?? "";
  const [designId, setDesignId] = useState<string>(
    designById(initialDesign) || textDesignById(initialDesign) ? initialDesign : ""
  );
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [quantity, setQuantity] = useState(1);

  /**
   * The chosen colour's hex, for the preview to paint behind the mock-up.
   *
   * Found by asking each axis rather than looking for a label called "Цвят":
   * the axis that carries swatches is the colour one by definition, and that
   * survives a supplier who names it something else.
   */
  const selectedHex = product.variants.reduce<string | undefined>(
    (found, axis) => found ?? axis.swatch?.[variants[axis.label] ?? ""],
    undefined
  );

  /**
   * One print carries one piece of artwork, so choosing a design puts the
   * upload aside and uploading puts the design aside. Silently keeping both and
   * printing whichever the renderer happens to prefer would be the worse
   * failure — it is invisible until the parcel arrives.
   */
  const textDesign = textDesignById(designId);
  const artworkUrl =
    designId && !textDesign ? designImage(designId) : textDesign ? "" : photoUrl;

  const takesPhoto = product.personalization.includes("PHOTO");
  /**
   * A ready-made design is offered wherever a design can go — which is not the
   * same set as "takes a photograph".
   *
   * The picker was gated on PHOTO, so every garment marked TEXT + DESIGN — the
   * hoodies, the polo, the caps, the shorts — advertised designs in the
   * catalogue and offered none on the page. Uploading stays gated on PHOTO,
   * because that genuinely is a different capability.
   */
  const takesDesign =
    takesPhoto || product.personalization.includes("DESIGN");
  // EMBROIDERY used to fall through to the same text box, which is how nine
  // products came to advertise stitching and deliver a print.
  const takesText = product.personalization.includes("TEXT");

  async function onFile(file: File) {
    setDesignId("");
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
    // A design counts. Requiring an upload when one is chosen was the old rule
    // and would now block the shorter, likelier path through the page.
    if (takesPhoto && !photoKey && !designId) {
      toast.error("Избери дизайн или качи снимка, за да продължиш.");
      return;
    }
    add({
      productId: product.id,
      quantity,
      variants,
      photoKey: designId ? undefined : photoKey || undefined,
      designId: designId || undefined,
      placement: photoKey || designId ? placement : undefined,
      text: text.trim() || undefined,
      giftWrap,
    });
    toast.success(`${product.title} е добавен в количката`);
  }

  const wrapPrice = ADDONS.GIFT_WRAP.priceEUR;

  /**
   * The preview leads, and it appears before anything is uploaded.
   *
   * Sitting it below the upload button meant the page opened on a form. It also
   * meant text-only products — an embroidered polo, a hoodie with a name — had
   * no preview at all, because the old gate required a photograph.
   */
  const showPreview =
    Boolean(product.printArea) && (takesDesign || takesText);

  return (
    /**
     * Configurator layout: what you are changing on the left, the controls that
     * change it on the right, and the preview pinned so it stays in sight while
     * the options scroll past. That is how every serious customiser is built —
     * Printful's studio, Custom Ink, Zazzle — and the reason is the same in all
     * of them: a preview that scrolls away is a preview you stop believing.
     *
     * Falls back to one column when there is nothing to preview.
     */
    <div
      className={
        showPreview
          ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10"
          : "space-y-6"
      }
    >
      {showPreview && (
        <div className="lg:sticky lg:top-24 lg:self-start">
        <PhotoPlacer
          product={product}
          photoUrl={artworkUrl || undefined}
          isDesign={Boolean(designId)}
          artwork={
            textDesign ? (
              <TextDesignArt
                design={textDesign}
                name={text}
                // Ink follows the garment: cream on a dark shirt, charcoal on a
                // pale one. The same rule the preview's own line already uses.
                color={isLightHex(selectedHex) ? "#2B2B2B" : "#FEFCF8"}
              />
            ) : undefined
          }
          placement={placement}
          onChange={setPlacement}
          colorHex={selectedHex}
          text={text.trim() || undefined}
        />
        </div>
      )}

      <div className="space-y-6">
      {/* The set offer, stated where the decision is made. A hen weekend is six
          shirts and the customer does not know we reward that until they see
          it — by the basket it is too late to have changed what they picked. */}
      <div className="rounded-lg bg-forest/8 px-3.5 py-3 text-xs text-forest">
        <span className="font-semibold">Комплект за парти?</span> 4 броя −10%,
        6 броя −15%, 10 броя −20%. Смесвай размери, цветове и имена.
      </div>

      {takesDesign && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Избери дизайн</p>
            {designId && (
              <button
                type="button"
                onClick={() => setDesignId("")}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Изчисти
              </button>
            )}
          </div>
          <div className="mt-2.5">
            <DesignPicker value={designId} onChange={setDesignId} />
          </div>
        </div>
      )}

      {takesPhoto && (
        <div>
          <p className="text-sm font-semibold text-foreground">…или качи своя снимка</p>
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

        </div>
      )}


      {/* Colour before size, and both AFTER the artwork.
          It used to be the other way round, which asks somebody to pick a
          garment colour before knowing what goes on it — and the artwork is the
          decision, the rest are consequences of it. Swatch axes sort first for
          the same reason: the colour changes how a design reads, a size does
          not. */}
      {[...product.variants]
        .sort((a, b) => Number(Boolean(b.swatch)) - Number(Boolean(a.swatch)))
        .map((axis) => (
        <div key={axis.label}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">{axis.label}</p>
            {/* A t-shirt has thirty-nine colours. Naming the chosen one beside
                the label is what makes a grid of dots readable. */}
            {axis.swatch && variants[axis.label] && (
              <p className="text-xs text-muted-foreground">{variants[axis.label]}</p>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {axis.options.map((opt) => {
              const active = variants[axis.label] === opt;
              const hex = axis.swatch?.[opt];
              if (hex) {
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVariants((v) => ({ ...v, [axis.label]: opt }))}
                    aria-pressed={active}
                    aria-label={opt}
                    title={opt}
                    className={`size-8 rounded-full ring-1 ring-inset ring-foreground/15 transition-[box-shadow] ${
                      active
                        ? "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                        : "hover:ring-foreground/40"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              }
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
    </div>
  );
}

/** Rec. 709 luma, so a saturated blue is not mistaken for a light garment. */
function isLightHex(hex: string | undefined): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const n = parseInt(hex.slice(1), 16);
  const luma =
    0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return luma > 140;
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { hasImages, type MentyProduct } from "@/lib/shop/products";

/**
 * The gallery: one large image with thumbnails beside it on a desktop and
 * beneath it on a phone, as the reference lays the page out.
 *
 * A product with a single photograph shows no thumbnail rail at all rather than
 * a rail of one — a control that cannot do anything is worse than none.
 */
export function ProductGallery({ product }: { product: MentyProduct }) {
  const [active, setActive] = useState(0);

  if (!hasImages(product)) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl bg-sand ring-1 ring-border">
        <Sparkles className="size-8 text-forest/30" strokeWidth={1.5} />
        <p className="px-6 text-center text-sm text-muted-foreground">
          Снимката на този продукт се подготвя
        </p>
      </div>
    );
  }

  return (
    // `items-start` is load-bearing. In a flex row the default `stretch` made
    // the main image box grow to the thumbnail column's height, which overrode
    // aspect-square — and `object-cover` then answered a tall box by zooming
    // into a square photograph until only a collar was left.
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start">
      {product.images.length > 1 && (
        <ul className="flex gap-3 sm:flex-col">
          {product.images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Изглед ${i + 1}`}
                aria-current={i === active}
                className={`relative block size-16 overflow-hidden rounded-lg ring-1 transition-colors sm:size-20 ${
                  i === active ? "ring-foreground" : "ring-border hover:ring-foreground/40"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  className="bg-sand object-contain p-1"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-square w-full min-w-0 flex-1 overflow-hidden rounded-xl bg-sand ring-1 ring-border">
        <Image
          src={product.images[active]}
          alt={product.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
          // Contain, not cover. The studio shots are square but the supplier's
          // own photographs are portrait, and cropping one to a square frame
          // fills the gallery with a model's face.
          className="object-contain"
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";

/**
 * Poster thumbnail in the orders table, with a hover blow-up.
 *
 * Every poster carries a photo of a real child and words a stranger typed, so
 * both a bad likeness and an abusive word have to be caught before printing.
 * Scanning a column of thumbnails does that; opening every order does not.
 *
 * Plain <img>, not next/image: these are short-lived signed URLs on a private
 * bucket, so there is nothing for the optimiser to cache.
 */
export function OrderThumb({
  url,
  href,
  alt,
}: {
  url?: string;
  href: string;
  alt: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!url || broken) {
    return (
      <span className="grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground/50">
        <ImageOff className="size-4" />
      </span>
    );
  }

  return (
    <Link href={href} className="group/thumb relative block w-fit">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setBroken(true)}
        className="size-12 rounded-lg object-cover ring-1 ring-black/10 transition-transform group-hover/thumb:scale-105"
      />
      <span className="pointer-events-none absolute left-14 top-1/2 z-30 hidden -translate-y-1/2 group-hover/thumb:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="w-56 rounded-xl bg-white shadow-2xl ring-1 ring-black/10"
        />
      </span>
    </Link>
  );
}

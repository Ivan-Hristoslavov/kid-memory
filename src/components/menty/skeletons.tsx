/**
 * Loading skeletons.
 *
 * Shaped like the content they stand in for — a product card skeleton is a
 * square image block over two short lines and a price, in the same grid — so
 * the page does not jump when the real thing arrives. A generic spinner would
 * be less work and would tell the visitor nothing about what is coming.
 */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <div className="shimmer aspect-square w-full" />
      <div className="space-y-2 p-3">
        <div className="shimmer h-3.5 w-4/5 rounded" />
        <div className="shimmer h-3 w-2/5 rounded" />
        <div className="shimmer mt-3 h-4 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="shimmer h-3 w-56 rounded" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="shimmer aspect-square w-full rounded-xl" />
        <div className="space-y-5">
          <div className="shimmer h-9 w-2/3 rounded" />
          <div className="shimmer h-4 w-4/5 rounded" />
          <div className="shimmer h-7 w-24 rounded" />
          <div className="space-y-3 pt-4">
            <div className="shimmer h-10 w-1/3 rounded-lg" />
            <div className="shimmer h-12 w-full rounded-lg" />
            <div className="shimmer h-12 w-full rounded-lg" />
          </div>
          <div className="shimmer h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** A heading and a grid — the shape every collection page arrives in. */
export function CollectionSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="shimmer h-9 w-72 rounded" />
      <div className="shimmer mt-3 h-4 w-96 max-w-full rounded" />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

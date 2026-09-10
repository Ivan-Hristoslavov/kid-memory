import { LogoMark } from "@/components/menty/logo";

/**
 * Full-viewport loader for routes that have real server work to do.
 *
 * Was a pulsing pink heart on the old brand's dreamy gradient. It now shows the
 * Menty mark on the shop's own sand, breathing rather than bouncing: three dots
 * hopping reads as a chat app waiting for a reply, which is not what a shop
 * should look like while it prepares an order.
 *
 * Where the shape of the content is known — a product, a catalogue — a skeleton
 * beats this, because it tells the visitor what is arriving. See
 * components/menty/skeletons.
 */
export function PageLoader({ label = "Зареждаме…" }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-5 bg-sand">
      <span className="grid size-16 place-items-center rounded-xl bg-background text-[1.1rem] ring-1 ring-border">
        <LogoMark />
      </span>
      <span className="h-1 w-40 overflow-hidden rounded-full bg-border">
        <span className="shimmer block h-full w-full" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

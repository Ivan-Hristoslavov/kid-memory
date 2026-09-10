import "server-only";
import { PrintFactoryProvider } from "./printfactory";
import { PrintOnDemandProvider } from "./printondemand";
import type { PodProvider, PodSupplierId } from "./types";

export * from "./types";

const providers: Record<PodSupplierId, PodProvider> = {
  PRINTFACTORY: new PrintFactoryProvider(),
  PRINTONDEMAND: new PrintOnDemandProvider(),
};

/** A specific supplier, by id — for reading an old order's history. */
export function podProvider(id: PodSupplierId): PodProvider {
  return providers[id];
}

/**
 * The supplier new orders go to.
 *
 * Chosen by configuration rather than hardcoded, so moving printers is an
 * environment change. POD_SUPPLIER names it; otherwise the first configured one
 * wins, which makes a fresh deployment work without another variable to forget.
 */
export function activePodProvider(): PodProvider | null {
  const named = process.env.POD_SUPPLIER as PodSupplierId | undefined;
  if (named && providers[named]?.configured()) return providers[named];
  return Object.values(providers).find((p) => p.configured()) ?? null;
}

/** Every supplier the shop knows about, for the admin panel. */
export function allPodProviders(): readonly PodProvider[] {
  return Object.values(providers);
}

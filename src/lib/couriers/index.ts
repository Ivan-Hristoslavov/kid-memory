import "server-only";
import { EcontProvider } from "./econt";
import { SpeedyProvider } from "./speedy";
import type { CourierProvider } from "./types";

export * from "./types";

const providers: Record<"ECONT" | "SPEEDY", CourierProvider> = {
  ECONT: new EcontProvider(),
  SPEEDY: new SpeedyProvider(),
};

export function courier(id: "ECONT" | "SPEEDY"): CourierProvider {
  return providers[id];
}

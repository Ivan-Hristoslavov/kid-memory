import "server-only";
import { PodError, type PodOrder, type PodProvider } from "./types";

/**
 * PrintFactory — the previous supplier.
 *
 * Kept because the catalogue still carries their product codes and source
 * pages, and orders placed against them have to remain readable. It has no
 * working integration and never had one: their API endpoints were never
 * discoverable, and their documentation sits behind a customer login.
 *
 * `configured()` is therefore false, which keeps it out of the registry's
 * choice of an active supplier without deleting the history.
 */
export class PrintFactoryProvider implements PodProvider {
  readonly id = "PRINTFACTORY" as const;
  readonly name = "PrintFactory";

  configured(): boolean {
    return false;
  }

  async createOrder(): Promise<PodOrder> {
    throw new PodError(
      "PrintFactory has no API integration — its orders were placed by hand."
    );
  }

  async getOrder(): Promise<PodOrder> {
    throw new PodError("PrintFactory has no API integration.");
  }
}

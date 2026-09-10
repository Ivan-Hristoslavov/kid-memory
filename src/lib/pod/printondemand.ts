import "server-only";
import {
  PodError,
  type PodOrder,
  type PodOrderRequest,
  type PodOrderStatus,
  type PodProvider,
} from "./types";

/**
 * printondemand.bg, CLIENT API v2.2.
 *
 * A Laravel API under /api/*, authenticated with a bearer token.
 *
 * ── HOW THEIR MODEL WORKS, AND WHAT IT MEANS FOR US ──────────────────────
 * An order does NOT carry artwork. Every cart line references a `product_id`
 * that already exists in their system with its design applied, chosen from
 * "Стандартни продукти" or "Fulfilment продукти", plus a `size_id`. Nothing in
 * v2.2 accepts a file — the only upload-shaped endpoint, /api/labels/request,
 * orders physical sewn-in brand labels, not print artwork.
 *
 * So this API can reorder a fixed range. It cannot, on its own, produce a mug
 * carrying a photograph a customer uploaded ten minutes ago, because that mug
 * is a product that does not exist in their catalogue yet. See the note in
 * `createOrder`.
 * ─────────────────────────────────────────────────────────────────────────
 */
export class PrintOnDemandProvider implements PodProvider {
  readonly id = "PRINTONDEMAND" as const;
  readonly name = "printondemand.bg";

  configured(): boolean {
    return Boolean(process.env.PRINTONDEMAND_API_TOKEN);
  }

  private base(): string {
    return process.env.PRINTONDEMAND_API_URL || "https://printondemand.bg";
  }

  private async call<T>(
    path: string,
    init?: { method?: string; body?: unknown }
  ): Promise<T> {
    const token = process.env.PRINTONDEMAND_API_TOKEN;
    if (!token) throw new PodError("PRINTONDEMAND_API_TOKEN is not configured");

    let res: Response;
    try {
      res = await fetch(`${this.base()}${path}`, {
        method: init?.method ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: init?.body ? JSON.stringify(init.body) : undefined,
        cache: "no-store",
      });
    } catch (err) {
      // A network failure is worth retrying; a rejection is not.
      throw new PodError(
        `printondemand.bg unreachable: ${err instanceof Error ? err.message : err}`,
        true
      );
    }

    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new PodError(
        `printondemand.bg ${path}: HTTP ${res.status} ${body}`,
        res.status >= 500 || res.status === 429
      );
    }
    return (await res.json()) as T;
  }

  // ── Reference data ────────────────────────────────────────────────────
  // Their ids, not ours. Sizes and couriers in particular have to be looked up
  // rather than assumed: `size_id: 5` means whatever their nomenclature says
  // it means, and guessing prints the wrong garment.

  nomenclature = {
    colors: () => this.call<{ data: PodColor[] }>("/api/nomenclature/colors"),
    sizes: () => this.call<{ data: PodSize[] }>("/api/nomenclature/sizes"),
    manufacturers: () =>
      this.call<{ data: unknown[] }>("/api/nomenclature/manufacturers"),
    printTypes: () => this.call<{ data: unknown[] }>("/api/nomenclature/print-types"),
    couriers: () =>
      this.call<{ data: unknown[] }>("/api/nomenclature/delivery/couriers"),
    locationTypes: () =>
      this.call<{ data: unknown[] }>("/api/nomenclature/delivery/location-types"),
    orderStatuses: () =>
      this.call<{ data: PodStatusRow[] }>("/api/nomenclature/order/status"),
  };

  /**
   * Our products in their system, with live per-size price AND stock.
   *
   * The stock figure is the useful part: the shop's own catalogue has no idea
   * whether a blank is in the warehouse, and selling something that is not is
   * how a customer waits three weeks for a t-shirt.
   */
  listProducts(): Promise<{ data: PodProduct[] }> {
    return this.call<{ data: PodProduct[] }>("/api/products");
  }

  listFulfilmentProducts(): Promise<{ data: PodProduct[] }> {
    return this.call<{ data: PodProduct[] }>("/api/fulfilment-products");
  }

  // ── Orders ────────────────────────────────────────────────────────────

  /**
   * Places an order that printondemand.bg produces AND ships to the customer.
   *
   * Type 3 with `courier_location`, which is their "Изпращане към клиент → чрез
   * Print On Demand" variant: they book Econt or Speedy themselves, to an
   * office or to an address, Bulgaria only.
   *
   * NOTE ON `method_type`. The documentation contradicts itself here: variants
   * 3.1 and 3.2 are titled "чрез Print On Demand", which its own legend numbers
   * 3, while the example bodies send 1. The example is more likely to be what
   * the server accepts, so 1 is the default and the env var exists to flip it
   * without a deploy the moment their support says otherwise.
   *
   * Every line needs a `supplierProductId` — an id from THEIR catalogue. A line
   * without one cannot be ordered through this API at all, and saying so here
   * beats posting a request that will be rejected or, worse, silently produce
   * the wrong thing.
   */
  async createOrder(req: PodOrderRequest): Promise<PodOrder> {
    const cart = req.lines.map((line) => {
      const productId = Number(line.supplierProductCode);
      if (!Number.isFinite(productId)) {
        throw new PodError(
          `"${line.supplierUrl || "line"}" has no printondemand.bg product id. ` +
            `Their API orders products that already exist in their catalogue; ` +
            `it accepts no artwork, so a personalised item must be created on ` +
            `their side first.`
        );
      }
      const sizeId = Number(line.variants.size_id ?? line.variants["Размер"]);
      return {
        product_id: productId,
        size_id: Number.isFinite(sizeId) ? sizeId : undefined,
        quantity: line.quantity,
        use_label: false,
      };
    });

    const toOffice = Boolean(req.recipient.courierOffice);
    const body: Record<string, unknown> = {
      type: 3,
      names: req.recipient.name,
      phone: req.recipient.phone,
      email: req.recipient.email,
      comment: `Menty ${req.reference}`,
      method_type: Number(process.env.PRINTONDEMAND_METHOD_TYPE || 1),
      courier_id: req.recipient.courier === "SPEEDY" ? 2 : 1,
      courier_location: toOffice ? 1 : 2,
      cart,
    };
    if (toOffice) {
      body.office = req.recipient.courierOffice;
    } else {
      body.city = req.recipient.city;
      body.address_1 = req.recipient.address;
    }

    const res = await this.call<PodCheckoutResponse>("/api/checkout/checkout", {
      method: "POST",
      body,
    });

    if (res.status === false) {
      throw new PodError(res.messages || "printondemand.bg rejected the order");
    }

    return {
      id: String(res.order_id ?? res.id ?? req.reference),
      status: "RECEIVED",
    };
  }

  /**
   * v2.2 documents no per-order lookup — only a nomenclature of the statuses
   * that exist. Tracking therefore has to come from their panel or a webhook
   * until such an endpoint appears.
   */
  async getOrder(_id: string): Promise<PodOrder> {
    throw new PodError(
      "printondemand.bg CLIENT API v2.2 exposes no per-order status endpoint — " +
        "only /api/nomenclature/order/status, which lists the possible statuses."
    );
  }
}

export interface PodColor {
  id: number;
  name: string;
  hex: string;
}
export interface PodSize {
  id: number;
  name: string;
}
export interface PodStatusRow {
  id: number;
  name: string;
}

export interface PodProductSize {
  size: { id: number; name: string };
  use_id: string;
  item_price: string;
  print_price: string;
  total_price: string;
  /** Their warehouse count, as a decimal string. */
  quantity: string;
}

export interface PodProduct {
  id: number;
  name: string;
  cover: string;
  color: { id: number | string; name: string; hex: string } | null;
  manufacturer: { id: number | string; name: string; image: string | null } | null;
  sizes: PodProductSize[];
}

/** Their statuses, mapped to ours. Unknown stays UNKNOWN, never a guess. */
export function mapStatus(supplierStatus: string): PodOrderStatus {
  switch (supplierStatus.toLowerCase().trim()) {
    case "нова":
    case "new":
      return "RECEIVED";
    case "в производство":
    case "в изработка":
      return "IN_PRODUCTION";
    case "изпратена":
    case "изпратен":
      return "SHIPPED";
    case "доставена":
    case "доставен":
      return "DELIVERED";
    case "отказана":
    case "отменена":
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
}

interface PodCheckoutResponse {
  status?: boolean;
  messages?: string;
  order_id?: number | string;
  id?: number | string;
}

import "server-only";
import {
  PodError,
  type PodOrder,
  type PodOrderRequest,
  type PodOrderStatus,
  type PodProvider,
} from "./types";

/**
 * PrintFactory — an OpenCart shop with a WooCommerce/Shopify integration.
 *
 * ── THEIR MODEL IS THE MIRROR IMAGE OF printondemand.bg ───────────────────
 * printondemand.bg can be made to accept artwork: `/v2/crt-spd` takes a PNG as
 * a base64 data URL and creates a product out of it, which is how a mug with a
 * customer's photograph on it can exist at all.
 *
 * PrintFactory's integration cannot, and not because of a missing endpoint —
 * because of the shape of the thing. Their own documentation (help centre,
 * "Интеграции", articles 51, 52 and 57, read 2026-09-11) describes six steps,
 * and the first three are done by a human in a browser:
 *
 *   1. pick a blank from the catalogue
 *   2. place the design in THEIR Design Studio
 *   3. save it to Темплейти
 *   4. add it to the API каталог          ← only now is it visible to any API
 *   5. choose which sizes and colours to sell
 *   6. sync it to the shop, which mints a PF SKU
 *
 * "Ако един продукт не е добавен в API каталога, той няма да бъде достъпен за
 * синхронизация." The API caталог is not their product range. It is the list of
 * finished, designed products that one account has prepared by hand.
 *
 * And an order carries: PF SKU, variant, quantity, recipient, order number.
 * That is the complete list. No file, no URL, no artwork of any kind.
 *
 * So this integration can sell our 163 READY-MADE designs, where the artwork is
 * fixed and a SKU per design is exactly right. It cannot sell a photo mug. A
 * photograph uploaded ten minutes ago has no SKU and cannot be given one
 * without somebody opening their Design Studio.
 *
 * ── AND THEY DO NOT ISSUE THE WAYBILL ─────────────────────────────────────
 * Deliberately: "Print Factory не генерира автоматично товарителницата вместо
 * теб." We create the label with our own courier and upload it to their order.
 * So a PrintFactory job is never fully automatic — `createOrder` gets the thing
 * made, and a person still has to attach the label. The admin has to say so.
 *
 * ── THE ONE UNKNOWN ───────────────────────────────────────────────────────
 * The endpoint itself. Their help centre documents the payload and the flow but
 * never a URL, there is no public API reference, and the WooCommerce plugin
 * that knows the route is behind the customer login. Guessing was tried and
 * abandoned: every candidate under the /api prefix, every
 * index.php?route=extension/pf_... shape and the obvious REST paths return
 * OpenCart's 404.
 *
 * `PRINTFACTORY_API_PATH` therefore has no default, and `configured()` requires
 * it. Filling it in from the plugin is the whole remaining job; everything
 * below is written against the documented payload and needs no other change.
 * See docs/printfactory-api.md.
 * ─────────────────────────────────────────────────────────────────────────
 */
export class PrintFactoryProvider implements PodProvider {
  readonly id = "PRINTFACTORY" as const;
  readonly name = "PrintFactory";

  /**
   * Credentials alone are not enough.
   *
   * The client code and the API key have been on file since the shop's first
   * supplier and prove nothing about being able to reach anything. Without the
   * endpoint this provider cannot place an order, and a supplier that looks
   * available and fails after the customer has paid is worse than one that is
   * honestly absent — the same rule `stripeConfigured()` follows.
   */
  configured(): boolean {
    return Boolean(
      process.env.PRINTFACTORY_CLIENT_CODE &&
        process.env.PRINTFACTORY_API_KEY &&
        process.env.PRINTFACTORY_API_PATH
    );
  }

  private base(): string {
    const root = process.env.PRINTFACTORY_API_URL || "https://printfactory.bg";
    const path = process.env.PRINTFACTORY_API_PATH;
    if (!path) {
      throw new PodError(
        "PRINTFACTORY_API_PATH is not configured — the integration endpoint is " +
          "not published; take it from their WooCommerce plugin. See " +
          "docs/printfactory-api.md."
      );
    }
    return `${root.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }

  /**
   * Their integration identifies the account by client code and API key.
   *
   * Sent as headers rather than in the body so they never reach a log line, a
   * query string or an error message that quotes the request. Which header
   * names they expect is part of the same unknown as the path; these are the
   * names their settings screen uses, and they are one constant to correct.
   */
  private async call<T>(
    action: string,
    body?: unknown
  ): Promise<T> {
    const clientCode = process.env.PRINTFACTORY_CLIENT_CODE;
    const apiKey = process.env.PRINTFACTORY_API_KEY;
    if (!clientCode || !apiKey) {
      throw new PodError(
        "PRINTFACTORY_CLIENT_CODE and PRINTFACTORY_API_KEY are not configured"
      );
    }

    let res: Response;
    try {
      res = await fetch(`${this.base()}/${action}`, {
        method: "POST",
        headers: {
          "X-PF-Client-Code": clientCode,
          "X-PF-Api-Key": apiKey,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
        cache: "no-store",
      });
    } catch (err) {
      throw new PodError(
        `PrintFactory unreachable: ${err instanceof Error ? err.message : err}`,
        true
      );
    }

    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      throw new PodError(
        `PrintFactory ${action}: HTTP ${res.status} ${text}`,
        res.status >= 500 || res.status === 429
      );
    }
    return (await res.json()) as T;
  }

  /**
   * Hands an order over.
   *
   * Every line must carry a PF SKU. A line without one is a product nobody has
   * prepared in their Design Studio, and sending it would create an order they
   * cannot fulfil — better to refuse here, where the message names the product,
   * than to have it surface as a support email a week later.
   */
  async createOrder(req: PodOrderRequest): Promise<PodOrder> {
    const missing = req.lines.filter((l) => !l.supplierProductCode);
    if (missing.length > 0) {
      throw new PodError(
        `PrintFactory needs a PF SKU on every line; ${missing.length} line(s) ` +
          `have none (${missing.map((l) => l.supplierUrl).join(", ")}). ` +
          "A PF SKU exists only after the product is built in their Design " +
          "Studio and added to the API catalogue."
      );
    }

    const payload = {
      // Ours, so their support and ours can talk about one thing.
      order_reference: req.reference,
      items: req.lines.map((line) => ({
        pf_sku: line.supplierProductCode,
        quantity: line.quantity,
        // Their vocabulary, not ours. `variants` is already keyed the
        // supplier's way by the caller.
        options: line.variants,
      })),
      recipient: {
        name: req.recipient.name,
        phone: req.recipient.phone,
        email: req.recipient.email,
        city: req.recipient.city,
        address: req.recipient.address,
        courier: req.recipient.courier,
        office: req.recipient.courierOffice,
      },
    };

    const res = await this.call<{ order_id?: string | number; status?: string }>(
      "order/create",
      payload
    );
    if (res.order_id == null) {
      throw new PodError("PrintFactory accepted the order but returned no id");
    }
    return {
      id: String(res.order_id),
      status: mapStatus(res.status),
    };
  }

  async getOrder(id: string): Promise<PodOrder> {
    const res = await this.call<{
      status?: string;
      tracking_number?: string;
    }>("order/status", { order_id: id });
    return {
      id,
      status: mapStatus(res.status),
      trackingNumber: res.tracking_number,
    };
  }
}

/**
 * Their statuses onto ours.
 *
 * Unknown maps to UNKNOWN rather than to a guess. A status this code has not
 * seen is a status whose meaning it does not know, and showing "shipped" for
 * one of those is how a customer gets told their parcel is on its way before
 * anything has been printed.
 */
function mapStatus(raw: string | undefined): PodOrderStatus {
  switch (raw?.toLowerCase()) {
    case "new":
    case "received":
    case "pending":
      return "RECEIVED";
    case "processing":
    case "in_production":
    case "production":
      return "IN_PRODUCTION";
    case "shipped":
    case "sent":
      return "SHIPPED";
    case "delivered":
    case "completed":
      return "DELIVERED";
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
}

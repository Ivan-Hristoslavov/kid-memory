import "server-only";
import {
  PodError,
  type PodOrder,
  type PodOrderRequest,
  type PodOrderStatus,
  type PodProvider,
} from "./types";

/**
 * PrintFactory, through the API their WooCommerce plugin speaks.
 *
 * Not documented anywhere public. The endpoints, the authentication and the
 * payloads below were read out of `print-factory-api-v1.0.6.zip`, which their
 * panel offers at /pf_download_woocommerce.php, and then checked against the
 * live service. `docs/printfactory-api.md` records the whole protocol.
 *
 * It is six flat PHP files at the site root rather than a REST surface:
 *
 *   GET  pf_api_products.php              the API catalogue
 *   GET  pf_api_products_changed.php      only what changed since last sync
 *   GET  pf_api_mark_product_synced.php   acknowledge one product
 *   POST pf_api_receive_order.php         place an order
 *   GET  pf_api_queue_status.php          where that order got to
 *   POST pf_api_waybill_pdf.php           attach our courier label to it
 *
 * ── WHAT THIS API IS NOT ──────────────────────────────────────────────────
 * It is not their catalogue. `pf_api_products.php` returns the products that
 * THIS account has built by hand in their Design Studio and then explicitly
 * added to the API catalogue — their own help centre is blunt about it: a
 * product that is not in the API catalogue is not available for synchronisation
 * at all. Their ~150 blanks are not reachable through it and never were.
 *
 * Called today it answers `{"ok":true,...,"count":0,"products":[]}`. The
 * integration is live and the shelf behind it is empty, which is the correct
 * state for an account that has prepared nothing.
 *
 * ── AND AN ORDER CARRIES NO ARTWORK OF OURS ───────────────────────────────
 * An item is `{sku, qty, size, color, print_type, design_file, ...}`. That
 * `design_file` is a URL and it is tempting, but follow where the plugin gets
 * it: from `_pf_design_file`, product meta written at sync time out of the PF
 * product record. It is THEIR file for THEIR SKU, echoed back to them. Nothing
 * in the plugin ever puts a shop's own file there.
 *
 * Whether their worker would honour an arbitrary URL in that field is the one
 * question worth asking their support, because the answer decides whether this
 * shop can ever route a customer's photograph here. Until they answer it, the
 * honest reading is: fixed designs yes, personalisation no.
 *
 * ── THEY DO NOT ISSUE THE WAYBILL, DELIBERATELY ───────────────────────────
 * "Print Factory не генерира автоматично товарителницата вместо теб." We make
 * the label with our own courier and POST its URL to pf_api_waybill_pdf.php,
 * and the plugin's own validator allows an order through without one so it can
 * follow later. So a PrintFactory job is never fully automatic: `createOrder`
 * starts production, and a person still has to attach a label.
 * ─────────────────────────────────────────────────────────────────────────
 */
export class PrintFactoryProvider implements PodProvider {
  readonly id = "PRINTFACTORY" as const;
  readonly name = "PrintFactory";

  configured(): boolean {
    return Boolean(
      process.env.PRINTFACTORY_CLIENT_CODE && process.env.PRINTFACTORY_API_KEY
    );
  }

  private base(): string {
    return (
      process.env.PRINTFACTORY_API_URL || "https://printfactory.bg"
    ).replace(/\/$/, "");
  }

  private credentials(): { clientCode: string; apiKey: string } {
    const clientCode = process.env.PRINTFACTORY_CLIENT_CODE;
    const apiKey = process.env.PRINTFACTORY_API_KEY;
    if (!clientCode || !apiKey) {
      throw new PodError(
        "PRINTFACTORY_CLIENT_CODE and PRINTFACTORY_API_KEY are not configured"
      );
    }
    return { clientCode, apiKey };
  }

  /**
   * Their reads want the key twice — as a header and as a query parameter.
   *
   * The plugin sends both and there is no way to know from outside which one
   * the server actually reads, so this does the same rather than discovering
   * the answer in production. It does mean the key reaches their access log in
   * a URL, which is their design and not something this end can fix; it is a
   * reason to rotate it if it ever leaks, not a reason to send one and hope.
   */
  private async get<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const { apiKey } = this.credentials();
    const url = new URL(`${this.base()}/${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set("api_key", apiKey);

    return this.parse<T>(endpoint, () =>
      fetch(url, {
        headers: { "X-PF-API-KEY": apiKey, Accept: "application/json" },
        cache: "no-store",
      })
    );
  }

  private async post<T>(endpoint: string, payload: object): Promise<T> {
    const { clientCode, apiKey } = this.credentials();
    return this.parse<T>(endpoint, () =>
      fetch(`${this.base()}/${endpoint}`, {
        method: "POST",
        headers: {
          "X-PF-API-KEY": apiKey,
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        // The key and the client code go in the body as well. Same reasoning as
        // above: this is what the plugin does.
        body: JSON.stringify({ api_key: apiKey, client_code: clientCode, ...payload }),
        cache: "no-store",
      })
    );
  }

  /**
   * HTTP 200 is not success here.
   *
   * Every endpoint answers `{ok: true|false, error?: string}` and a rejected
   * request still comes back 200, so a caller that only checks `res.ok` would
   * read "order placed" off a refusal. The body is the authority.
   */
  private async parse<T>(
    endpoint: string,
    send: () => Promise<Response>
  ): Promise<T> {
    let res: Response;
    try {
      res = await send();
    } catch (err) {
      throw new PodError(
        `PrintFactory unreachable: ${err instanceof Error ? err.message : err}`,
        true
      );
    }

    const raw = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new PodError(
        `PrintFactory ${endpoint}: HTTP ${res.status}, not JSON: ${raw.slice(0, 200)}`,
        res.status >= 500
      );
    }

    const shape = body as { ok?: boolean; error?: string };
    if (!res.ok || shape.ok !== true) {
      throw new PodError(
        `PrintFactory ${endpoint}: ${shape.error ?? `HTTP ${res.status}`}`,
        res.status >= 500 || res.status === 429
      );
    }
    return body as T;
  }

  /**
   * The account's API catalogue.
   *
   * `PodProvider` deliberately has no `listCatalogue` — a supplier's range runs
   * to hundreds of blanks and which dozen we sell is a merchandising decision,
   * not a runtime discovery. This is the exception that proves it: what comes
   * back is not their range but the handful of finished products this account
   * prepared, and a PF SKU cannot be typed into our catalogue by hand because
   * it is minted on their side. So it has to be fetched, and it is fetched by
   * a script that writes a file — never at request time.
   */
  async listApiCatalogue(changedOnly = false): Promise<PfApiProduct[]> {
    const res = await this.get<{ count?: number; products?: PfApiProduct[] }>(
      changedOnly ? "pf_api_products_changed.php" : "pf_api_products.php"
    );
    return res.products ?? [];
  }

  /** Tells them a product has been taken, so it stops appearing as changed. */
  async markSynced(apiClientProductId: number): Promise<void> {
    await this.get("pf_api_mark_product_synced.php", {
      api_client_product_id: apiClientProductId,
    });
  }

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

    // Their validator rejects an order with no telephone before it rejects
    // anything else, and a courier cannot deliver without one either.
    if (!req.recipient.phone) {
      throw new PodError("PrintFactory requires recipient.telephone");
    }

    const [firstname, ...rest] = req.recipient.name.trim().split(/\s+/);
    const payload = {
      external_order_id: req.reference,
      source: "menty",
      items: req.lines.map((line) => ({
        sku: line.supplierProductCode,
        qty: line.quantity,
        size: line.variants.size,
        color: line.variants.color,
        print_type: line.variants.print_type,
        options: line.variants,
      })),
      recipient: {
        firstname,
        lastname: rest.join(" "),
        telephone: req.recipient.phone,
        email: req.recipient.email,
        address_1: req.recipient.address ?? req.recipient.courierOffice ?? "",
        city: req.recipient.city,
        country: "BG",
      },
      shipping: {
        courier: req.recipient.courier,
        // We issue the label ourselves and attach it afterwards; their plugin
        // allows exactly this, so production can start before the courier has
        // been called.
        waybill_mode: "own_waybill_later",
      },
    };

    const res = await this.post<{
      api_queue_id?: number;
      order_id?: number | string;
      status?: string;
    }>("pf_api_receive_order.php", payload);

    // The queue id is what their own status endpoint prefers, and it exists
    // immediately; the PF order id appears only once the queue row is picked
    // up. Storing the queue id keeps `getOrder` working in the gap between.
    const id = res.api_queue_id ?? res.order_id;
    if (id == null) {
      throw new PodError("PrintFactory accepted the order but returned no id");
    }
    return { id: String(id), status: mapStatus(res.status) };
  }

  async getOrder(id: string): Promise<PodOrder> {
    const numeric = Number(id);
    const res = await this.get<{
      found?: boolean;
      status?: string;
      order_id?: number | string;
      tracking_number?: string;
    }>(
      "pf_api_queue_status.php",
      Number.isFinite(numeric) && numeric > 0
        ? { api_queue_id: numeric }
        : { external_order_id: id }
    );

    // `ok: true, found: false` is their answer for an order they do not have.
    // That is not an error and must not be reported as one — but neither is it
    // a status, so it maps to UNKNOWN rather than to RECEIVED.
    return {
      id,
      status: res.found ? mapStatus(res.status) : "UNKNOWN",
      trackingNumber: res.tracking_number,
    };
  }

  /**
   * Attaches our courier label to an order they are already making.
   *
   * A URL rather than bytes, because that is what their endpoint takes — which
   * means the link has to be reachable by their server and should therefore be
   * signed and short-lived. It is a shipping label with a customer's name,
   * address and telephone on it.
   */
  async attachWaybill(
    queueId: string,
    pdfUrl: string,
    filename: string
  ): Promise<void> {
    await this.post("pf_api_waybill_pdf.php", {
      source: "menty",
      api_queue_id: Number(queueId) || 0,
      waybill: { pdf_url: pdfUrl, filename },
    });
  }
}

/**
 * One row of their API catalogue.
 *
 * Only the fields this shop reads. Their response carries more — print type
 * labels, colour hexes, a parent product id — and adding a field here is
 * cheaper than pretending to model a payload nobody publishes.
 */
export interface PfApiProduct {
  api_client_product_id: number;
  sku: string;
  name?: string;
  product_model?: string;
  design_id?: string;
  saved_product_id?: string;
  /** THEIR artwork for THIS sku. Not a slot for ours — see the class comment. */
  design_file?: string;
  thumb_front?: string;
  print_type?: string;
  option_schema?: unknown;
}

/**
 * Their statuses onto ours.
 *
 * Anything unrecognised is UNKNOWN, not a guess. A status this code has not
 * seen is one whose meaning it does not know, and showing "shipped" for it is
 * how a customer is told the parcel is on its way before anything is printed.
 */
function mapStatus(raw: string | undefined): PodOrderStatus {
  switch (raw?.toLowerCase()) {
    case "new":
    case "queued":
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

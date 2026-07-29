import "server-only";
import type {
  CourierOffice,
  CourierProvider,
  DeliveryKind,
  ShipmentRequest,
  ShipmentResult,
} from "./types";

const SPEEDY_API = (process.env.SPEEDY_BASE_URL || "https://api.speedy.bg/v1").replace(/\/$/, "");

/**
 * Speedy JSON API v1. Supports office delivery, address delivery and
 * automated лockers (APT). Docs: https://api.speedy.bg/api/docs/
 */
export class SpeedyProvider implements CourierProvider {
  readonly id = "SPEEDY" as const;
  readonly name = "Спиди";

  private creds() {
    const userName = process.env.SPEEDY_API_USER;
    const password = process.env.SPEEDY_API_PASSWORD;
    if (!userName || !password) throw new Error("Speedy API credentials are not configured");
    return { userName, password, language: "BG" };
  }

  private async call<T>(pathname: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${SPEEDY_API}/${pathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...this.creds(), ...body }),
    });
    if (!res.ok) throw new Error(`Speedy API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as T & { error?: { message: string } };
    if (json.error) throw new Error(`Speedy API: ${json.error.message}`);
    return json;
  }

  async listOffices(city: string, kind: DeliveryKind): Promise<CourierOffice[]> {
    type SpeedyOffice = {
      id: number;
      name: string;
      address: { localAddressString: string; siteName?: string };
      type: "OFFICE" | "APT";
    };
    const data = await this.call<{ offices: SpeedyOffice[] }>("location/office", {
      countryId: 100, // Bulgaria
      name: city,
    });
    return (data.offices ?? [])
      .filter((o) => (kind === "LOCKER" ? o.type === "APT" : o.type === "OFFICE"))
      .map((o) => ({
        id: String(o.id),
        name: o.name,
        address: o.address.localAddressString,
        city: o.address.siteName ?? city,
        isLocker: o.type === "APT",
      }));
  }

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    const recipient: Record<string, unknown> = {
      clientName: req.recipientName,
      phone1: { number: req.phone },
      privatePerson: true,
    };
    if (req.deliveryKind === "ADDRESS") {
      recipient.addressLocation = { siteName: req.city, countryId: 100 };
      recipient.address = { fullAddressString: req.address };
    } else {
      recipient.pickupOfficeId = Number(req.officeId);
    }

    const data = await this.call<{ id: string }>("shipment", {
      recipient,
      service: {
        serviceId: 505, // standard 24h
        additionalServices: {
          cod: { amount: req.codAmountEUR, currencyCode: "EUR", processingType: "CASH" },
        },
      },
      content: {
        parcelsCount: 1,
        totalWeight: 0.5,
        contents: req.description,
        package: "ENVELOPE",
      },
      payment: { courierServicePayer: "SENDER" },
      ref1: `order-${req.orderNumber}`,
    });
    return { trackingNumber: data.id };
  }

  async trackShipment(trackingNumber: string) {
    const data = await this.call<{
      parcels: { operations: { description: string }[] }[];
    }>("track", { parcels: [{ barcode: trackingNumber }], lastOperationOnly: false });
    const ops = data.parcels?.[0]?.operations ?? [];
    return {
      status: ops.at(-1)?.description ?? "unknown",
      events: ops.map((o) => o.description),
    };
  }
}

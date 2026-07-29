import "server-only";
import type {
  CourierOffice,
  CourierProvider,
  DeliveryKind,
  ShipmentRequest,
  ShipmentResult,
} from "./types";

// Production: https://ee.econt.com/services  ·  Demo: https://demo.econt.com/ee/services
// Demo credentials for testing: iasp-dev / 1Asp-dev
const ECONT_API = (process.env.ECONT_BASE_URL || "https://ee.econt.com/services").replace(/\/$/, "");

/**
 * Econt Express JSON API (NomenclaturesService + ShipmentService).
 * Supports office delivery, address delivery and Econtomat lockers.
 * Docs: https://www.econt.com/developers/soap-json-api.html
 */
export class EcontProvider implements CourierProvider {
  readonly id = "ECONT" as const;
  readonly name = "Еконт";

  private auth(): string {
    const user = process.env.ECONT_API_USER;
    const pass = process.env.ECONT_API_PASSWORD;
    if (!user || !pass) throw new Error("Econt API credentials are not configured");
    return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  }

  private async call<T>(service: string, method: string, body: unknown): Promise<T> {
    const res = await fetch(`${ECONT_API}/${service}.${method}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: this.auth() },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Econt API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json() as Promise<T>;
  }

  async listOffices(city: string, kind: DeliveryKind): Promise<CourierOffice[]> {
    type EcontOffice = {
      code: string;
      name: string;
      isAPS: boolean;
      address: { city: { name: string }; fullAddress: string };
    };
    const data = await this.call<{ offices: EcontOffice[] }>(
      "Nomenclatures/NomenclaturesService",
      "getOffices",
      { countryCode: "BGR" }
    );
    return data.offices
      .filter((o) => o.address.city.name.toLowerCase() === city.toLowerCase())
      .filter((o) => (kind === "LOCKER" ? o.isAPS : !o.isAPS))
      .map((o) => ({
        id: o.code,
        name: o.name,
        address: o.address.fullAddress,
        city: o.address.city.name,
        isLocker: o.isAPS,
      }));
  }

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    const receiver: Record<string, unknown> = {
      name: req.recipientName,
      phones: [req.phone],
    };
    const label: Record<string, unknown> = {
      senderClientId: process.env.ECONT_API_USER,
      receiverClient: receiver,
      packCount: 1,
      shipmentType: "PACK",
      weight: 0.5,
      shipmentDescription: req.description,
      // The delivery fee is already inside codAmountEUR (calcGrandTotalEUR), so
      // the courier must bill US for the service, not the customer. Left unset,
      // Econt can charge the recipient at the counter and the customer pays for
      // shipping twice — which is exactly how a personalised parcel gets
      // refused. Speedy states the same intent via courierServicePayer:"SENDER".
      // Verify against your Econt contract with one real test shipment.
      paymentSenderMethod: process.env.ECONT_SENDER_PAYMENT || "credit",
      services: {
        cdAmount: req.codAmountEUR,
        cdType: "get",
        cdCurrency: "EUR",
      },
    };
    if (req.deliveryKind === "ADDRESS") {
      receiver.address = { city: { name: req.city, country: { code3: "BGR" } }, fullAddress: req.address };
    } else {
      label.receiverOfficeCode = req.officeId;
    }

    const data = await this.call<{ label: { shipmentNumber: string; pdfURL?: string } }>(
      "Shipments/LabelService",
      "createLabel",
      { label, mode: "create" }
    );
    return { trackingNumber: data.label.shipmentNumber, labelUrl: data.label.pdfURL };
  }

  async trackShipment(trackingNumber: string) {
    const data = await this.call<{
      shipmentStatuses: { status: { shortDeliveryStatus?: string; trackingEvents?: { destinationDetails?: string }[] } }[];
    }>("Shipments/ShipmentService", "getShipmentStatuses", { shipmentNumbers: [trackingNumber] });
    const status = data.shipmentStatuses?.[0]?.status;
    return {
      status: status?.shortDeliveryStatus ?? "unknown",
      events: (status?.trackingEvents ?? []).map((e) => e.destinationDetails ?? ""),
    };
  }
}

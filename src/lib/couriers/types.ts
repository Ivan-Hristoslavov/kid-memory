/**
 * Courier abstraction. Econt and Speedy implement the same interface so
 * checkout, admin and emails stay courier-agnostic.
 */

export type DeliveryKind = "OFFICE" | "ADDRESS" | "LOCKER";

export interface CourierOffice {
  id: string;
  name: string;
  address: string;
  city: string;
  /** true for Econtomat / Speedy locker */
  isLocker: boolean;
}

export interface ShipmentRequest {
  orderNumber: number;
  recipientName: string;
  phone: string;
  city: string;
  deliveryKind: DeliveryKind;
  address?: string;
  officeId?: string;
  /** Cash on delivery amount in EUR. */
  codAmountEUR: number;
  description: string;
}

export interface ShipmentResult {
  trackingNumber: string;
  labelUrl?: string;
}

export interface CourierProvider {
  readonly id: "ECONT" | "SPEEDY";
  readonly name: string;
  listOffices(city: string, kind: DeliveryKind): Promise<CourierOffice[]>;
  createShipment(req: ShipmentRequest): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<{ status: string; events: string[] }>;
}

import { NextResponse } from "next/server";
import { courier } from "@/lib/couriers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Office / locker lookup for checkout. Returns [] when API creds are missing. */
export async function GET(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`offices:${ip}`, { limit: 60, windowMs: 60 * 60 * 1000 }).ok) {
    return NextResponse.json({ offices: [] }, { status: 429 });
  }

  const url = new URL(req.url);
  const courierId = url.searchParams.get("courier");
  const city = url.searchParams.get("city")?.trim() ?? "";
  const kind = url.searchParams.get("kind") === "LOCKER" ? "LOCKER" : "OFFICE";

  if ((courierId !== "ECONT" && courierId !== "SPEEDY") || city.length < 2) {
    return NextResponse.json({ offices: [] });
  }

  try {
    const offices = await courier(courierId).listOffices(city, kind);
    return NextResponse.json({ offices: offices.slice(0, 50) });
  } catch {
    // No credentials or API down — checkout falls back to free-text office input
    return NextResponse.json({ offices: [] });
  }
}

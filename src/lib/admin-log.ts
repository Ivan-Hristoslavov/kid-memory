import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Append-only record of what happened to an order — status changes,
 * regenerations, resent emails, failed generations.
 *
 * Never throws: an audit write must not be able to fail the operation it is
 * recording.
 */
export async function logAdminEvent(entry: {
  orderId?: string | null;
  action: string;
  detail?: string | null;
  actor?: string | null;
}): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        orderId: entry.orderId ?? null,
        action: entry.action,
        detail: entry.detail ?? null,
        actor: entry.actor ?? "admin",
      },
    });
  } catch (err) {
    console.error("admin log write failed:", err);
  }
}

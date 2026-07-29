"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Ban, Check, Loader2, Printer, Truck } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/app/actions/admin";

/**
 * One-click move to the next step, instead of picking from a dropdown and
 * pressing save. Fulfilment is a fixed pipeline, so at any point there is
 * exactly one obvious next action — this surfaces that and leaves the full
 * dropdown for the rare correction.
 */
type Step = {
  next: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

const NEXT_STEP: Partial<Record<OrderStatus, Step>> = {
  CONFIRMED: {
    next: "PRINTING",
    label: "Пусни в печат",
    icon: Printer,
    tone: "bg-emerald-600 hover:bg-emerald-700",
  },
  PRINTING: {
    next: "SHIPPED",
    label: "Отбележи като изпратена",
    icon: Truck,
    tone: "bg-sky-600 hover:bg-sky-700",
  },
  SHIPPED: {
    next: "DELIVERED",
    label: "Отбележи като доставена",
    icon: Check,
    tone: "bg-violet-600 hover:bg-violet-700",
  },
};

export function QuickStatus({
  orderId,
  status,
  confirmed,
}: {
  orderId: string;
  status: OrderStatus;
  /** Whether the customer clicked the confirmation link. */
  confirmed: boolean;
}) {
  const [state, action, pending] = useActionState(updateOrderStatus, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  const step = NEXT_STEP[status];
  const blocked = status === "CONFIRMED" && !confirmed;

  if (!step && status !== "DELIVERED" && status !== "CANCELLED") return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {step && (
        <form action={action}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value={step.next} />
          <Button
            type="submit"
            size="lg"
            // Printing before the customer confirms is exactly how an unclaimed
            // parcel happens, so that one button is disabled rather than warned.
            disabled={pending || blocked}
            title={blocked ? "Клиентът още не е потвърдил поръчката" : undefined}
            className={`rounded-full text-white ${step.tone}`}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <step.icon className="size-4" />
            )}
            {step.label}
          </Button>
        </form>
      )}

      {blocked && (
        <span className="text-sm font-semibold text-amber-700">
          Чака потвърждение от клиента
        </span>
      )}

      {status !== "CANCELLED" && status !== "DELIVERED" && (
        <form action={action}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="CANCELLED" />
          <Button
            type="submit"
            size="lg"
            variant="ghost"
            disabled={pending}
            className="rounded-full text-muted-foreground hover:text-destructive"
          >
            <Ban className="size-4" /> Откажи
          </Button>
        </form>
      )}
    </div>
  );
}

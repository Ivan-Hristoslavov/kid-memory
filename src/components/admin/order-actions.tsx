"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FileText, Mail, RefreshCw, Send, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createShipment,
  generateFinalPdf,
  resendOrderEmail,
  updateOrderStatus,
  type AdminActionState,
} from "@/app/actions/admin";
import { regeneratePoster } from "@/app/actions/admin-extra";
import type { OrderStatus } from "@prisma/client";

const STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "CREATED", label: "Нова" },
  { id: "GENERATING", label: "Генерира се" },
  { id: "PREVIEW_READY", label: "Преглед готов" },
  { id: "CONFIRMED", label: "Потвърдена" },
  { id: "PRINTING", label: "Печат" },
  { id: "SHIPPED", label: "Изпратена" },
  { id: "DELIVERED", label: "Доставена" },
  { id: "CANCELLED", label: "Отказана" },
];

function useToastState(state: AdminActionState) {
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
}

export function OrderActions({
  orderId,
  status,
  hasFinal,
  hasPdf,
  hasCustomer,
}: {
  orderId: string;
  status: OrderStatus;
  hasFinal: boolean;
  hasPdf: boolean;
  hasCustomer: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(updateOrderStatus, {});
  const [shipState, shipAction, shipPending] = useActionState(createShipment, {});
  const [pdfState, pdfAction, pdfPending] = useActionState(generateFinalPdf, {});
  const [mailState, mailAction, mailPending] = useActionState(resendOrderEmail, {});
  const [regenState, regenAction, regenPending] = useActionState(regeneratePoster, {});

  useToastState(statusState);
  useToastState(shipState);
  useToastState(pdfState);
  useToastState(mailState);
  useToastState(regenState);

  return (
    <section className="glass rounded-3xl p-7">
      <h2 className="font-heading text-lg font-bold">Действия</h2>

      <form action={statusAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="orderId" value={orderId} />
        <div className="space-y-2">
          <Label>Статус</Label>
          <Select name="status" defaultValue={status}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">Товарителница (ръчно)</Label>
          <Input
            id="trackingNumber"
            name="trackingNumber"
            className="h-11 rounded-xl"
            placeholder="по избор"
          />
        </div>
        <Button type="submit" disabled={statusPending} className="h-11 self-end rounded-xl">
          Запази
        </Button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <form action={regenAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <Button
            type="submit"
            variant="outline"
            disabled={regenPending}
            className="w-full rounded-xl border-primary/40 text-primary hover:text-primary"
          >
            <RefreshCw className={`size-4 ${regenPending ? "animate-spin" : ""}`} />
            {regenPending ? "Рисува..." : "Прегенерирай"}
          </Button>
        </form>
        <form action={shipAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <Button
            type="submit"
            variant="outline"
            disabled={shipPending || !hasCustomer}
            className="w-full rounded-xl"
          >
            <Truck className="size-4" />
            {shipPending ? "Създава..." : "Товарителница"}
          </Button>
        </form>
        <form action={pdfAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <Button
            type="submit"
            variant="outline"
            disabled={pdfPending || !hasFinal}
            className="w-full rounded-xl"
          >
            <FileText className="size-4" />
            {pdfPending ? "Генерира..." : hasPdf ? "Прегенерирай PDF" : "PDF за печат"}
          </Button>
        </form>
        <form action={mailAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <Button
            type="submit"
            variant="outline"
            disabled={mailPending || !hasCustomer}
            className="w-full rounded-xl"
          >
            <Mail className="size-4" />
            {mailPending ? "Изпраща..." : "Прати имейл"}
          </Button>
        </form>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Send className="size-3.5" />
        Смяната на статус към „Изпратена“ автоматично известява клиента по имейл.
      </p>
    </section>
  );
}

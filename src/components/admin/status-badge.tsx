"use client";

import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@prisma/client";

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  CREATED: { label: "Нова", className: "bg-muted text-muted-foreground" },
  GENERATING: { label: "Генерира се", className: "bg-sky text-accent-foreground" },
  PREVIEW_READY: { label: "Преглед готов", className: "bg-lavender text-secondary-foreground" },
  CONFIRMED: { label: "Потвърдена", className: "bg-sun text-foreground" },
  PRINTING: { label: "Печат", className: "bg-peach text-foreground" },
  SHIPPED: { label: "Изпратена", className: "bg-mint text-foreground" },
  DELIVERED: { label: "Доставена", className: "bg-primary text-primary-foreground" },
  CANCELLED: { label: "Отказана", className: "bg-destructive/15 text-destructive" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return <Badge className={`rounded-full border-none ${meta.className}`}>{meta.label}</Badge>;
}

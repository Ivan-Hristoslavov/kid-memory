import Link from "next/link";
import { AlertTriangle, Clock, Printer, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/catalog";

/**
 * What needs doing right now, at the top of the admin.
 *
 * The order table alone forced the owner to remember which status means "act on
 * this" — and, critically, that a CONFIRMED order still must not be printed
 * until the customer has clicked the confirmation link.
 */
export async function WorkQueue() {
  const [awaitingConfirm, toPrint, toShip, revenueToday] = await Promise.all([
    prisma.order.findMany({
      where: { status: "CONFIRMED", confirmedAt: null },
      select: { id: true, orderNumber: true, childName: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    prisma.order.findMany({
      where: { status: "CONFIRMED", confirmedAt: { not: null } },
      select: { id: true, orderNumber: true, childName: true, priceEUR: true },
      orderBy: { confirmedAt: "asc" },
      take: 8,
    }),
    prisma.order.findMany({
      where: { status: "PRINTING" },
      select: { id: true, orderNumber: true, childName: true, city: true },
      orderBy: { updatedAt: "asc" },
      take: 8,
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["CONFIRMED", "PRINTING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOfToday() },
      },
      _sum: { priceEUR: true },
      _count: true,
    }),
  ]);

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-3">
      <Queue
        icon={Clock}
        tone="amber"
        title="Чакат потвърждение"
        empty="Няма чакащи."
        hint="Не печатай тези — клиентът още не е потвърдил от имейла."
        items={awaitingConfirm.map((o) => ({
          id: o.id,
          label: `№${o.orderNumber} · ${o.childName}`,
          meta: daysAgo(o.createdAt),
        }))}
      />
      <Queue
        icon={Printer}
        tone="emerald"
        title="За печат"
        empty="Нищо за печат."
        hint="Потвърдени от клиента — може да влизат в печат."
        items={toPrint.map((o) => ({
          id: o.id,
          label: `№${o.orderNumber} · ${o.childName}`,
          meta: o.priceEUR ? formatPrice(Number(o.priceEUR)) : "",
        }))}
      />
      <Queue
        icon={Truck}
        tone="sky"
        title="За изпращане"
        empty="Нищо за изпращане."
        hint="Отпечатани — чакат товарителница."
        items={toShip.map((o) => ({
          id: o.id,
          label: `№${o.orderNumber} · ${o.childName}`,
          meta: o.city ?? "",
        }))}
        footer={`Днес: ${revenueToday._count} поръчки · ${formatPrice(Number(revenueToday._sum.priceEUR ?? 0))}`}
      />
    </section>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return "днес";
  if (days === 1) return "вчера";
  return `преди ${days} дни`;
}

const TONES = {
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  sky: "bg-sky-50 text-sky-950 ring-sky-200",
} as const;

function Queue({
  icon: Icon,
  tone,
  title,
  hint,
  empty,
  items,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  title: string;
  hint: string;
  empty: string;
  items: { id: string; label: string; meta: string }[];
  footer?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ${TONES[tone]}`}>
      <p className="flex items-center gap-2 font-heading font-bold">
        <Icon className="size-5" />
        {title}
        <span className="ml-auto rounded-full bg-white/70 px-2.5 py-0.5 text-sm">
          {items.length}
        </span>
      </p>
      <p className="mt-1 text-xs opacity-75">{hint}</p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm opacity-60">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/admin/orders/${it.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm transition-colors hover:bg-white"
              >
                <span className="truncate font-semibold">{it.label}</span>
                <span className="shrink-0 text-xs opacity-70">{it.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {footer && (
        <p className="mt-4 flex items-center gap-1.5 border-t border-current/15 pt-3 text-xs font-semibold">
          <AlertTriangle className="size-3.5 opacity-0" />
          {footer}
        </p>
      )}
    </div>
  );
}

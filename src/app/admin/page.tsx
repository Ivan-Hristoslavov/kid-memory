import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import {
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  Clock,
  Package,
  Search,
  TrendingUp,
  Truck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { ADDONS, PRODUCTS, formatPrice, type ProductId } from "@/lib/catalog";
import { StatusBadge } from "@/components/admin/status-badge";
import { WorkQueue } from "@/components/admin/work-queue";
import { BatchPrintButton } from "@/components/admin/batch-print";
import { ContactActions } from "@/components/admin/contact-actions";
import { OrderThumb } from "@/components/admin/order-thumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FILTERS: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: "all", label: "Всички", statuses: [] },
  { id: "new", label: "За обработка", statuses: ["CREATED", "PREVIEW_READY", "CONFIRMED"] },
  { id: "generating", label: "Генериране", statuses: ["GENERATING"] },
  { id: "printing", label: "Печат", statuses: ["PRINTING"] },
  { id: "shipped", label: "Изпратени", statuses: ["SHIPPED"] },
  { id: "completed", label: "Доставени", statuses: ["DELIVERED"] },
  { id: "cancelled", label: "Отказани", statuses: ["CANCELLED"] },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter = "all", q = "" } = await searchParams;
  const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const query = q.trim();

  const where: Prisma.OrderWhereInput = {
    ...(activeFilter.statuses.length > 0 ? { status: { in: activeFilter.statuses } } : {}),
    ...(query
      ? {
          OR: [
            { childName: { contains: query, mode: "insensitive" as const } },
            { customerName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
            { trackingNumber: { contains: query, mode: "insensitive" as const } },
            ...(Number.isFinite(Number(query)) && query !== ""
              ? [{ orderNumber: Number(query) }]
              : []),
          ],
        }
      : {}),
  };

  const paidStatuses: OrderStatus[] = ["CONFIRMED", "PRINTING", "SHIPPED", "DELIVERED"];
  const today = startOfDay(new Date());

  const [orders, counts, revenue, todayAgg] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({ _sum: { priceEUR: true }, where: { status: { in: paidStatuses } } }),
    prisma.order.aggregate({
      _sum: { priceEUR: true },
      _count: true,
      where: { status: { in: paidStatuses }, createdAt: { gte: today } },
    }),
  ]);

  // One batched signing call rather than one per row.
  const thumbs = await storage()
    .signedUrls(
      orders.map((o) => o.previewImage).filter((k): k is string => Boolean(k)),
      15 * 60
    )
    .catch(() => ({}) as Record<string, string>);

  const countFor = (statuses: OrderStatus[]) =>
    statuses.length === 0
      ? counts.reduce((sum, c) => sum + c._count, 0)
      : counts.filter((c) => statuses.includes(c.status)).reduce((s, c) => s + c._count, 0);

  const totalRevenue = Number(revenue._sum.priceEUR ?? 0);
  const todayRevenue = Number(todayAgg._sum.priceEUR ?? 0);
  const paidCount = countFor(paidStatuses);
  const avgOrder = paidCount ? totalRevenue / paidCount : 0;

  const stats = [
    {
      label: "Общо поръчки",
      value: String(countFor([])),
      sub: `${paidCount} потвърдени`,
      icon: Package,
      tint: "bg-sky/50",
    },
    {
      label: "Оборот",
      value: formatPrice(totalRevenue),
      sub: `днес ${formatPrice(todayRevenue)}`,
      icon: CircleDollarSign,
      tint: "bg-mint/50",
    },
    {
      label: "Средна поръчка",
      value: formatPrice(Math.round(avgOrder * 100) / 100),
      sub: `${todayAgg._count} днес`,
      icon: TrendingUp,
      tint: "bg-lavender/50",
    },
    {
      label: "За обработка",
      value: String(countFor(["CREATED", "PREVIEW_READY", "CONFIRMED", "GENERATING", "PRINTING"])),
      sub: `${countFor(["DELIVERED"])} доставени`,
      icon: Clock,
      tint: "bg-sun/50",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">
              Табло за поръчки
            </h1>
            <p className="mt-1 text-muted-foreground">
              Управление на „Бисерите на моето дете“
            </p>
          </div>
          {/* search */}
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="filter" value={activeFilter.id} />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Търси по име, телефон, №..."
                className="h-11 w-64 rounded-full border-2 pl-10"
              />
            </div>
            <Button type="submit" className="h-11 rounded-full px-5">
              Търси
            </Button>
            {query && (
              <Button asChild variant="ghost" className="h-11 rounded-full">
                <Link href={`/admin?filter=${activeFilter.id}`}>Изчисти</Link>
              </Button>
            )}
          </form>
        </div>

        {/* stat cards */}
        {/* What needs doing, before the numbers. */}
        <div className="mt-8 flex justify-end">
          <BatchPrintButton />
        </div>

        <div className="mt-4">
          <WorkQueue />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass flex items-center gap-4 rounded-2xl p-5">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl ${s.tint} text-foreground/70`}
              >
                <s.icon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-2xl font-extrabold leading-none">{s.value}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground/70">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={`/admin?filter=${f.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                f.id === activeFilter.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f.label} · {countFor(f.statuses)}
            </Link>
          ))}
        </div>

        <div className="glass mt-6 overflow-x-auto rounded-3xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">№</TableHead>
                <TableHead className="w-16">Постер</TableHead>
                <TableHead>Дете и думички</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead className="text-right">Сума</TableHead>
                <TableHead>Доставка</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-14 text-right">Дата</TableHead>
                <TableHead className="text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    {query ? `Няма резултати за „${query}“.` : "Няма поръчки в този филтър."}
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => {
                const kids = (order.children as { name: string; age: number }[]) ?? [];
                const addonNames = order.addons
                  .map((a) => ADDONS[a as keyof typeof ADDONS]?.name)
                  .filter(Boolean);
                const orderWords = ((order.words as { saidAs: string }[]) ?? []).slice(0, 4);
                // Confirmed by us but not yet by the customer — must not print.
                const awaitingCustomer = order.status === "CONFIRMED" && !order.confirmedAt;
                return (
                  <TableRow key={order.id} className="align-middle hover:bg-muted/40">
                    <TableCell className="font-heading text-base font-bold tabular-nums">
                      {order.orderNumber}
                    </TableCell>

                    {/* Thumbnail so a bad likeness or an inappropriate word is
                        caught by scanning the list, not by opening every order. */}
                    <TableCell>
                      <OrderThumb
                        url={order.previewImage ? thumbs[order.previewImage] : undefined}
                        href={`/admin/orders/${order.id}`}
                        alt={`Постер на ${order.childName}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold">{order.childName}</div>
                      <div className="text-xs text-muted-foreground">
                        {kids.length > 1
                          ? kids.map((k) => `${k.name} ${k.age} г.`).join(" · ")
                          : `${order.childAge} г.`}
                      </div>
                      {orderWords.length > 0 && (
                        <div className="mt-1 max-w-[16rem] truncate text-xs text-muted-foreground/80">
                          {orderWords.map((w) => `„${w.saidAs}“`).join(" · ")}
                        </div>
                      )}
                    </TableCell>

                    {/* Name, phone and the call buttons belong together — they
                        were three columns of mostly empty space before. */}
                    <TableCell>
                      {order.customerName || order.phone ? (
                        <>
                          <div className="font-medium">{order.customerName ?? "—"}</div>
                          {order.phone && (
                            <div className="text-xs tabular-nums text-muted-foreground">
                              {order.phone}
                            </div>
                          )}
                          <div className="mt-1.5">
                            <ContactActions
                              phone={order.phone}
                              email={order.email}
                              orderNumber={order.orderNumber}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {order.productType ? (
                        <>
                          <div className="font-medium">
                            {PRODUCTS[order.productType as ProductId].name}
                          </div>
                          {addonNames.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              + {addonNames.join(", ")}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Money right-aligned and tabular so columns of prices
                        line up on the decimal and can be scanned. */}
                    <TableCell className="text-right font-heading font-bold tabular-nums">
                      {order.priceEUR ? formatPrice(Number(order.priceEUR)) : "—"}
                    </TableCell>

                    <TableCell className="text-sm">
                      {order.courier ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Truck className="size-3.5 text-muted-foreground" />
                            {order.courier === "SPEEDY" ? "Спиди" : "Еконт"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.trackingNumber ?? order.city ?? ""}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={order.status} />
                        {awaitingCustomer && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Clock className="size-3" /> чака клиента
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-right text-sm tabular-nums text-muted-foreground">
                      {order.createdAt.toLocaleDateString("bg-BG", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Отвори <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {orders.length === 200 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Показани са последните 200 поръчки. Използвай търсенето за по-стари.
          </p>
        )}
      </div>
    </main>
  );
}

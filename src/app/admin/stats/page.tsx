import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import { CircleDollarSign, Package, Star, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PRODUCTS, STYLES, formatPrice, type ProductId } from "@/lib/catalog";
import { BarChart, BreakdownBars } from "@/components/admin/charts";

export const metadata: Metadata = {
  title: "Статистика — администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAID: OrderStatus[] = ["CONFIRMED", "PRINTING", "SHIPPED", "DELIVERED"];
const DAYS = 14;

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Нова",
  GENERATING: "Генерира се",
  PREVIEW_READY: "Преглед готов",
  CONFIRMED: "Потвърдена",
  PRINTING: "Печат",
  SHIPPED: "Изпратена",
  DELIVERED: "Доставена",
  CANCELLED: "Отказана",
};

export default async function AdminStatsPage() {
  const since = new Date();
  since.setDate(since.getDate() - (DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [recent, statusCounts, paidOrders, reviewAgg, allOrders] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, priceEUR: true, status: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.findMany({
      where: { status: { in: PAID } },
      select: { productType: true, priceEUR: true, addons: true },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { status: "APPROVED" },
    }),
    prisma.order.findMany({ select: { style: true } }),
  ]);

  // daily series
  const dayKey = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}`;
  const days: { label: string; orders: number; revenue: number }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    days.push({ label: dayKey(d), orders: 0, revenue: 0 });
  }
  for (const o of recent) {
    const idx = Math.floor((o.createdAt.getTime() - since.getTime()) / 86400000);
    if (idx >= 0 && idx < DAYS) {
      days[idx].orders += 1;
      if (PAID.includes(o.status)) days[idx].revenue += Number(o.priceEUR ?? 0);
    }
  }

  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.priceEUR ?? 0), 0);
  const avgOrder = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  // conversion: previews generated → paid
  const generated = statusCounts
    .filter((c) => c.status !== "CREATED" && c.status !== "GENERATING")
    .reduce((s, c) => s + c._count, 0);
  const conversion = generated ? (paidOrders.length / generated) * 100 : 0;

  const productBreakdown = (Object.keys(PRODUCTS) as ProductId[])
    .map((id) => ({
      label: PRODUCTS[id].name,
      value: paidOrders.filter((o) => o.productType === id).length,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const styleBreakdown = STYLES.map((s) => ({
    label: s.name,
    value: allOrders.filter((o) => o.style === s.id).length,
  }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const addonCounts = paidOrders.reduce<Record<string, number>>((acc, o) => {
    for (const a of o.addons) acc[a] = (acc[a] ?? 0) + 1;
    return acc;
  }, {});
  const addonLabels: Record<string, string> = {
    FRAME: "Рамка",
    PHOTO_PAPER: "Фотохартия",
    GIFT_WRAP: "Подаръчна опаковка",
  };
  const addonBreakdown = Object.entries(addonCounts)
    .map(([k, v]) => ({ label: addonLabels[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  const statusBreakdown = statusCounts
    .map((c) => ({ label: STATUS_LABELS[c.status], value: c._count }))
    .sort((a, b) => b.value - a.value);

  const kpis = [
    {
      label: "Оборот (потвърдени)",
      value: formatPrice(Math.round(totalRevenue * 100) / 100),
      icon: CircleDollarSign,
      tint: "bg-mint/50",
    },
    {
      label: "Средна поръчка",
      value: formatPrice(Math.round(avgOrder * 100) / 100),
      icon: TrendingUp,
      tint: "bg-lavender/50",
    },
    {
      label: "Конверсия преглед → поръчка",
      value: `${conversion.toFixed(0)}%`,
      icon: Package,
      tint: "bg-sky/50",
    },
    {
      label: "Среден рейтинг",
      value: reviewAgg._count
        ? `${(Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10).toFixed(1)} / 5`
        : "—",
      icon: Star,
      tint: "bg-sun/50",
    },
  ];

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Статистика</h1>
        <p className="mt-1 text-muted-foreground">Последните {DAYS} дни и общи разбивки.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="glass flex items-center gap-4 rounded-2xl p-5">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl ${k.tint} text-foreground/70`}
              >
                <k.icon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-2xl font-extrabold leading-none">{k.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="glass rounded-3xl p-7">
            <h2 className="mb-5 font-heading text-lg font-bold">Поръчки по дни</h2>
            <BarChart data={days.map((d) => ({ label: d.label, value: d.orders }))} />
          </section>

          <section className="glass rounded-3xl p-7">
            <h2 className="mb-5 font-heading text-lg font-bold">Оборот по дни (€)</h2>
            <BarChart
              data={days.map((d) => ({
                label: d.label,
                value: Math.round(d.revenue),
              }))}
              suffix=" €"
            />
          </section>

          <section className="glass rounded-3xl p-7">
            <h2 className="mb-5 font-heading text-lg font-bold">Продукти</h2>
            <BreakdownBars data={productBreakdown} />
          </section>

          <section className="glass rounded-3xl p-7">
            <h2 className="mb-5 font-heading text-lg font-bold">Статуси</h2>
            <BreakdownBars data={statusBreakdown} colorClass="bg-sky-500" />
          </section>

          <section className="glass rounded-3xl p-7">
            <h2 className="mb-5 font-heading text-lg font-bold">Избрани стилове</h2>
            <BreakdownBars data={styleBreakdown} colorClass="bg-violet-500" />
          </section>

          <section className="glass rounded-3xl p-7">
            <h2 className="mb-5 font-heading text-lg font-bold">Добавки</h2>
            <BreakdownBars data={addonBreakdown} colorClass="bg-emerald-500" />
          </section>
        </div>
      </div>
    </main>
  );
}

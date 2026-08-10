import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { ADDONS, PRODUCTS, formatPrice, type ProductId } from "@/lib/catalog";
import { getTemplate, orderSubjects } from "@/lib/templates";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderActions } from "@/components/admin/order-actions";
import { CopyButton } from "@/components/admin/copy-button";
import { ContactActions } from "@/components/admin/contact-actions";
import { QuickStatus } from "@/components/admin/quick-status";

export const metadata: Metadata = {
  title: "Поръчка — администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const previewUrl = order.previewImage
    ? await storage().signedUrl(order.previewImage, 15 * 60)
    : null;
  const finalUrl = order.finalImage
    ? await storage().signedUrl(order.finalImage, 15 * 60)
    : null;
  const pdfUrl = order.finalPdf ? await storage().signedUrl(order.finalPdf, 15 * 60) : null;

  // Always through the mapper — orders placed before templates existed carry
  // `children` and an empty `subjects`, and would otherwise render blank.
  const template = getTemplate(order.template);
  const subjects = orderSubjects(order);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Всички поръчки
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="font-heading text-3xl font-extrabold">
            Поръчка №{order.orderNumber}
          </h1>
          <StatusBadge status={order.status} />
          {/* Printing before the customer confirms is how unclaimed parcels
              happen — make the state impossible to miss. */}
          {order.confirmedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
              <BadgeCheck className="size-4" />
              Потвърдена от клиента ·{" "}
              {order.confirmedAt.toLocaleDateString("bg-BG", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
              <Clock className="size-4" />
              Чака потвърждение — не печатай още
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="glass rounded-3xl p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-bold">Постер</h2>
                {/* The template decides how this order is drawn and printed, so
                    it is the first thing the operator needs to see. */}
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  {template.name}
                </span>
              </div>
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">
                    {subjects.length > 1 ? template.subject.nounPlural : template.subject.noun}
                  </dt>
                  <dd className="mt-1 space-y-1 font-semibold">
                    {subjects.map((s, i) => (
                      <div key={i}>
                        {s.name}
                        {[
                          typeof s.age === "number" ? `${s.age} г.` : null,
                          s.gender
                            ? s.gender === "FEMALE"
                              ? template.subject.genderLabels[1]
                              : template.subject.genderLabels[0]
                            : null,
                          s.species || null,
                          s.relation || null,
                        ]
                          .filter(Boolean)
                          .map((bit) => (
                            <span key={String(bit)} className="ml-2 font-normal text-muted-foreground">
                              {bit}
                            </span>
                          ))}
                      </div>
                    ))}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Стил / животни</dt>
                  <dd className="font-semibold">
                    {order.style}
                    {order.animals.length > 0 ? ` · ${order.animals.join(", ")}` : ""}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">{template.lines.heading}</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {subjects.flatMap((subj, si) =>
                      subj.lines.map((l, i) => (
                        <span
                          key={`${si}-${i}`}
                          className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground"
                        >
                          „{l.text}“
                          {l.sub ? <span className="opacity-60"> ({l.sub})</span> : null}
                        </span>
                      ))
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="glass rounded-3xl p-7">
              <h2 className="font-heading text-lg font-bold">Клиент и доставка</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Клиент</dt>
                  <dd className="font-semibold">{order.customerName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Контакт</dt>
                  <dd className="font-semibold">
                    <span className="tabular-nums">{order.phone ?? "—"}</span>
                    <br />
                    <span className="font-normal text-muted-foreground">
                      {order.email ?? ""}
                    </span>
                    <span className="mt-2 block">
                      <ContactActions
                        phone={order.phone}
                        email={order.email}
                        orderNumber={order.orderNumber}
                        size="md"
                      />
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Продукт</dt>
                  <dd className="font-semibold">
                    {order.productType
                      ? `${PRODUCTS[order.productType as ProductId].name} · ${formatPrice(Number(order.priceEUR))}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Доставка</dt>
                  <dd className="font-semibold">
                    {order.courier === "SPEEDY" ? "Спиди" : order.courier === "ECONT" ? "Еконт" : "—"}
                    {order.deliveryMethod ? ` · ${order.deliveryMethod}` : ""}
                    <br />
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {order.city ?? ""} {order.address ?? order.courierOffice ?? ""}
                      {(order.city || order.address || order.courierOffice) && (
                        <CopyButton
                          label="адреса"
                          value={[
                            order.customerName,
                            order.phone,
                            order.city,
                            order.address ?? order.courierOffice,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        />
                      )}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Добавки</dt>
                  <dd className="font-semibold">
                    {order.addons.length
                      ? order.addons
                          .map((a) => ADDONS[a as keyof typeof ADDONS]?.name ?? a)
                          .join(", ")
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Товарителница</dt>
                  <dd className="font-semibold">{order.trackingNumber ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Създадена</dt>
                  <dd className="font-semibold">
                    {order.createdAt.toLocaleString("bg-BG")}
                  </dd>
                </div>
              </dl>
            </section>

            {/* The one obvious next step, before the full controls. */}
            <section className="glass rounded-3xl p-7">
              <h2 className="font-heading text-lg font-bold">Следваща стъпка</h2>
              <div className="mt-4">
                <QuickStatus
                  orderId={order.id}
                  status={order.status}
                  confirmed={Boolean(order.confirmedAt)}
                />
              </div>
            </section>

            <OrderActions
              orderId={order.id}
              status={order.status}
              hasFinal={Boolean(order.finalImage)}
              hasPdf={Boolean(order.finalPdf)}
              hasCustomer={Boolean(order.customerName && order.email)}
            />
          </div>

          <aside className="space-y-4">
            {previewUrl && (
              <div className="glass overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Преглед с воден знак" className="w-full" />
                <p className="p-3 text-center text-xs text-muted-foreground">
                  Преглед (воден знак)
                </p>
              </div>
            )}
            <div className="glass space-y-2 rounded-3xl p-5 text-sm">
              {finalUrl ? (
                <a
                  href={finalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-semibold text-primary hover:underline"
                >
                  ⬇ Финално изображение (4K PNG)
                </a>
              ) : (
                <p className="text-muted-foreground">Финалът още не е генериран.</p>
              )}
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-semibold text-primary hover:underline"
                >
                  ⬇ PDF за печат (A3)
                </a>
              ) : (
                <p className="text-muted-foreground">PDF още не е генериран.</p>
              )}
              <p className="pt-2 text-xs text-muted-foreground">
                Връзките са подписани и изтичат след 15 минути.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Mail, PackageSearch, Printer, Star, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { SuccessConfetti } from "@/components/checkout/success-confetti";
import { PurchaseTracker } from "@/components/checkout/purchase-tracker";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Поръчката е приета",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; id?: string }>;
}) {
  const { order, id } = await searchParams;
  const settings = await getSettings();

  // Looked up by cuid, never by the guessable sequential order number.
  const record = id
    ? await prisma.order
        .findUnique({
          where: { id },
          select: { id: true, orderNumber: true, priceEUR: true },
        })
        .catch(() => null)
    : null;

  const total = record?.priceEUR ? Number(record.priceEUR) : null;
  const orderNumber = record?.orderNumber ?? (order ? Number(order) : null);

  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy relative flex-1 overflow-hidden px-6 pt-12 pb-20">
        <SuccessConfetti />
        {record && total !== null && (
          <PurchaseTracker orderId={record.id} valueEUR={total} />
        )}

        <div className="glass relative mx-auto max-w-xl rounded-3xl p-8 text-center sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Heart className="size-8 fill-current" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight">
            Получихме твоята поръчка ❤️
          </h1>
          {orderNumber && (
            <p className="mt-3 font-heading text-lg font-bold text-primary">
              Поръчка №{orderNumber}
            </p>
          )}

          {/* Nothing moves until they confirm, so this outranks everything else
              on the page. */}
          <div className="mt-7 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 text-left">
            <p className="flex items-center gap-2 font-heading font-bold">
              <Mail className="size-5 text-primary" />
              Провери пощата си сега
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Изпратихме ти имейл с бутон „Потвърждавам поръчката“. Постерът е
              персонализиран, затова го пускаме за печат едва след твоето
              потвърждение. Ако имейлът не е там — виж папка „Спам“.
            </p>
          </div>

          <ol className="mt-8 space-y-4 text-left">
            <Step icon={Printer} title="Потвърждаваш и печатаме">
              Изработваме постера точно както го видя на екрана.
            </Step>
            <Step icon={Truck} title={`Изпращаме за ${settings.deliveryDays}`}>
              Пишем ти номера на товарителницата, щом пратката тръгне.
            </Step>
            <Step icon={Heart} title="Плащаш при получаване">
              {total !== null ? (
                <>
                  Приготви{" "}
                  <strong className="text-foreground">{formatPrice(total)}</strong> за
                  куриера — крайна сума с доставката, без скрити такси.
                </>
              ) : (
                "Наложен платеж — плащаш на куриера, нищо предварително."
              )}
            </Step>
          </ol>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link href={orderNumber ? `/proverka?order=${orderNumber}` : "/proverka"}>
                <PackageSearch className="size-5" /> Проследи поръчката
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/otzivi">
                <Star className="size-5" /> Остави отзив след доставка
              </Link>
            </Button>
          </div>
        </div>

        {/* Word of mouth is the cheapest channel for a gift that hangs on a
            wall — ask while the excitement is at its peak. */}
        <div className="glass mx-auto mt-6 max-w-xl rounded-3xl p-7 text-center">
          <h2 className="font-heading text-xl font-bold">
            Знаеш ли друг родител, който събира такива думички?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Изпрати му линка — повечето родители дори не знаят, че това е възможно.
          </p>
          <Button asChild variant="ghost" className="mt-4 rounded-full">
            <Link href="/">Сподели сайта</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Step({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-heading font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
    </li>
  );
}

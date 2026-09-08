import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  Heart,
  Mail,
  PackageSearch,
  Printer,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
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
          select: {
            id: true,
            orderNumber: true,
            priceEUR: true,
            productType: true,
            paymentMethod: true,
            paymentStatus: true,
          },
        })
        .catch(() => null)
    : null;

  const total = record?.priceEUR ? Number(record.priceEUR) : null;
  const orderNumber = record?.orderNumber ?? (order ? Number(order) : null);

  const isCard = record?.paymentMethod === "STRIPE";
  const isPaid = record?.paymentStatus === "PAID";
  const isDigital = record?.productType === "DIGITAL";
  /**
   * A card customer can land here before Stripe's webhook does — the redirect
   * and the webhook are two independent races back to us. Saying "paid" while
   * the order still reads PENDING would be a promise the admin queue does not
   * yet back, so this in-between state gets its own honest message.
   */
  const awaitingPayment = isCard && !isPaid;

  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy relative flex-1 overflow-hidden px-6 pt-12 pb-20">
        <SuccessConfetti />
        {/* Only report a sale that actually is one. A card order that has not
            settled yet would otherwise be counted, and every ad platform would
            optimise toward abandoned payments. */}
        {record && total !== null && !awaitingPayment && (
          <PurchaseTracker orderId={record.id} valueEUR={total} />
        )}

        <div className="glass relative mx-auto max-w-xl rounded-2xl p-8 text-center sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Heart className="size-8 fill-current" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight">
            {isPaid
              ? "Плащането мина ❤️"
              : awaitingPayment
                ? "Почти готово..."
                : "Получихме твоята поръчка ❤️"}
          </h1>
          {orderNumber && (
            <p className="mt-3 font-heading text-lg font-bold text-primary">
              Поръчка №{orderNumber}
            </p>
          )}

          {/* The single most important thing on the page differs per payment
              method: cash on delivery is blocked on a confirmation click, a
              settled card order is blocked on nothing. */}
          {awaitingPayment ? (
            <div className="mt-7 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 text-left">
              <p className="flex items-center gap-2 font-heading font-bold">
                <Clock className="size-5 text-primary" />
                Обработваме плащането
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Банката потвърждава превода в рамките на минута. Щом мине, получаваш
                имейл и поръчката тръгва — не е нужно да правиш нищо повече.
              </p>
            </div>
          ) : isPaid ? (
            <div className="mt-7 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 text-left">
              <p className="flex items-center gap-2 font-heading font-bold">
                <ShieldCheck className="size-5 text-emerald-600" />
                Плащането е прието
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isDigital
                  ? "Изпращаме ти линк за сваляне на файла в пълно качество. Ако не е в пощата до няколко минути — виж папка „Спам“."
                  : "Пускаме постера за печат веднага. При получаване не дължиш нищо на куриера."}
              </p>
            </div>
          ) : (
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
          )}

          <ol className="mt-8 space-y-4 text-left">
            {isDigital ? (
              <>
                <Step icon={Printer} title="Файлът е готов">
                  Пращаме ти го в 4K качество — за печат навсякъде.
                </Step>
                <Step icon={Mail} title="Линк в пощата">
                  Валиден 24 часа; нов можеш да си вземеш по всяко време от „Моите
                  поръчки“.
                </Step>
              </>
            ) : (
              <>
                <Step
                  icon={Printer}
                  title={isPaid ? "Печатаме веднага" : "Потвърждаваш и печатаме"}
                >
                  Изработваме постера точно както го видя на екрана.
                </Step>
                <Step icon={Truck} title={`Изпращаме за ${settings.deliveryDays}`}>
                  Пишем ти номера на товарителницата, щом пратката тръгне.
                </Step>
                <Step
                  icon={Heart}
                  title={isPaid ? "Нищо за доплащане" : "Плащаш при получаване"}
                >
                  {isPaid ? (
                    "Сумата е платена онлайн — просто приемаш пратката."
                  ) : total !== null ? (
                    <>
                      Приготви{" "}
                      <strong className="text-foreground">{formatPrice(total)}</strong> за
                      куриера — крайна сума с доставката, без скрити такси.
                    </>
                  ) : (
                    "Наложен платеж — плащаш на куриера, нищо предварително."
                  )}
                </Step>
              </>
            )}
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
        <div className="glass mx-auto mt-6 max-w-xl rounded-2xl p-7 text-center">
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

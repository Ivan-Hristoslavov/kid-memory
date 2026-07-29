import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Потвърждение на поръчка",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One-click confirmation from the order email. A personalised poster that comes
 * back unclaimed is a total loss, so nothing reaches the printer until the
 * customer has actively said yes here.
 *
 * Confirming is idempotent — reopening the link shows the same confirmed state
 * rather than an error, because customers do reopen old emails.
 */
export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const settings = await getSettings();

  const order = await prisma.order
    .findUnique({
      where: { confirmToken: token },
      select: {
        id: true,
        orderNumber: true,
        childName: true,
        priceEUR: true,
        confirmedAt: true,
        status: true,
      },
    })
    .catch(() => null);

  if (!order) {
    return (
      <Shell title="Тази връзка вече не е валидна">
        <p className="mt-4 text-muted-foreground">
          Възможно е поръчката да е отменена или връзката да е изтекла. Пиши ни на{" "}
          <a className="text-primary underline" href={`mailto:${settings.contactEmail}`}>
            {settings.contactEmail}
          </a>{" "}
          и ще проверим веднага.
        </p>
        <Button asChild className="mt-8 rounded-full" size="lg">
          <Link href="/">Към началото</Link>
        </Button>
      </Shell>
    );
  }

  const alreadyConfirmed = Boolean(order.confirmedAt);
  if (!alreadyConfirmed && order.status !== "CANCELLED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { confirmedAt: new Date() },
    });
  }

  const total = order.priceEUR ? formatPrice(Number(order.priceEUR)) : null;

  return (
    <Shell
      title={
        alreadyConfirmed
          ? `Поръчка №${order.orderNumber} вече е потвърдена`
          : "Готово — пускаме я за печат ❤️"
      }
    >
      <p className="mt-4 text-muted-foreground">
        Спомен №<strong className="text-foreground">{order.orderNumber}</strong> за{" "}
        <strong className="text-foreground">{order.childName}</strong> е потвърден.
      </p>

      <ul className="mt-8 space-y-4 text-left">
        <Step icon={BadgeCheck} title="Потвърдено от теб">
          Постерът влиза в печат точно както го видя.
        </Step>
        <Step icon={Clock} title={`Изработка и изпращане: ${settings.deliveryDays}`}>
          Ще ти пишем с номер на товарителницата, щом тръгне.
        </Step>
        <Step icon={Truck} title="Плащане при доставка">
          {total ? (
            <>
              Приготви <strong className="text-foreground">{total}</strong> за куриера —
              това е крайната сума с доставката.
            </>
          ) : (
            "Плащаш на куриера при получаване."
          )}
        </Step>
      </ul>

      <Button asChild className="mt-9 rounded-full" size="lg">
        <Link href={`/proverka?order=${order.orderNumber}`}>Проследи поръчката</Link>
      </Button>
    </Shell>
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

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy relative flex flex-1 items-center justify-center px-6 pt-12 pb-20">
        <div className="glass w-full max-w-lg rounded-3xl p-9 text-center sm:p-12">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">{title}</h1>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

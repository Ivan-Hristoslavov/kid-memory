import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import {
  CheckoutForm,
  type CheckoutPaymentMethod,
} from "@/components/checkout/checkout-form";
import { enabledPaymentMethods } from "@/lib/payments";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Поръчка",
  robots: { index: false },
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) notFound();

  if (order.status !== "PREVIEW_READY") {
    return (
      <>
        <MentyHeader />
        <main className="bg-sand flex flex-1 items-center justify-center px-6 pt-12 pb-20">
          <div className="bg-card ring-1 ring-border max-w-md rounded-xl p-10 text-center">
            <h1 className="font-heading text-2xl font-bold">
              Тази поръчка вече е потвърдена ❤️
            </h1>
            <p className="mt-3 text-muted-foreground">
              Ако искаш още един, създай нов постер.
            </p>
            <Button asChild className="mt-6 rounded-lg">
              <Link href="/create">Създай постер</Link>
            </Button>
          </div>
        </main>
        <MentyFooter />
      </>
    );
  }

  const previewUrl = order.previewImage
    ? await storage().signedUrl(order.previewImage, 30 * 60)
    : null;

  // Resolved on the server so the form never renders a payment option the
  // action would reject.
  const methods = enabledPaymentMethods() as readonly CheckoutPaymentMethod[];

  return (
    <>
      <MentyHeader />
      <main className="bg-sand flex-1 pt-12 pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Последна стъпка до постера на {order.childName}
          </h1>
          <p className="mt-3 text-center text-muted-foreground">
            {methods.includes("STRIPE")
              ? "Плащаш с карта или при доставка — както ти е удобно."
              : "Плащане при доставка — без карта, без риск."}
          </p>
          <CheckoutForm
            orderId={order.id}
            childName={order.childName}
            previewUrl={previewUrl}
            paymentMethods={methods}
          />
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

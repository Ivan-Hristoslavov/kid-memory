import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { CheckoutForm } from "@/components/checkout/checkout-form";
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
        <SiteHeader />
        <main className="bg-dreamy flex flex-1 items-center justify-center px-6 pt-12 pb-20">
          <div className="glass max-w-md rounded-3xl p-10 text-center">
            <h1 className="font-heading text-2xl font-bold">
              Тази поръчка вече е потвърдена ❤️
            </h1>
            <p className="mt-3 text-muted-foreground">
              Ако искаш нов постер, създай нов спомен.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/create">Създай нов спомен</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const previewUrl = order.previewImage
    ? await storage().signedUrl(order.previewImage, 30 * 60)
    : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy flex-1 pt-12 pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Последна стъпка до спомена на {order.childName}
          </h1>
          <p className="mt-3 text-center text-muted-foreground">
            Плащане при доставка — без карта, без риск.
          </p>
          <CheckoutForm
            orderId={order.id}
            childName={order.childName}
            previewUrl={previewUrl}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

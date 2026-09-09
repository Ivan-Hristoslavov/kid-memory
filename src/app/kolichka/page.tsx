import type { Metadata } from "next";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { CartView } from "@/components/menty/cart-view";

export const metadata: Metadata = {
  title: "Количка",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Количка
          </h1>
          <CartView />
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

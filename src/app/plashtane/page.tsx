import type { Metadata } from "next";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { MentyCheckoutForm } from "@/components/menty/checkout-form";
import { enabledPaymentMethods } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Плащане",
  robots: { index: false },
};

/**
 * Payment methods are resolved on the server so the form never offers an
 * option the action would refuse — card only appears once the merchant account
 * is actually configured.
 */
export default function CheckoutPage() {
  const methods = enabledPaymentMethods() as readonly ("COD" | "STRIPE")[];

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Плащане
          </h1>
          <MentyCheckoutForm paymentMethods={methods} />
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

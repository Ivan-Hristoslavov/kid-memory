import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { TrackForm } from "@/components/site/track-form";

export const metadata: Metadata = {
  title: "Провери поръчката си",
  description:
    "Провери статуса на своята поръчка с номер на поръчка и телефон — етап на изработка, куриер и товарителница.",
  alternates: { canonical: "/proverka" },
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy flex-1 px-6 pt-14 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Къде е моят спомен?
          </h1>
          <p className="mt-4 text-muted-foreground">
            Въведи номера на поръчката и телефона, с който я направи.
          </p>
        </div>
        <div className="mt-10">
          <TrackForm defaultOrderNumber={order} />
        </div>
      </main>
      <Footer />
    </>
  );
}

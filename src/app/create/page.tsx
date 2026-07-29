import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { Wizard } from "@/components/wizard/wizard";

export const metadata: Metadata = {
  title: "Създай персонализиран постер",
  description:
    "Създай уникален детски постер със снимка, име и смешните думи на твоето дете. Готов за 5 минути, плащане при доставка.",
  alternates: { canonical: "/create" },
};

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy flex-1 pt-12 pb-20">
        <Wizard />
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { BookWizard } from "@/components/book/wizard";

export const metadata: Metadata = {
  title: "Създай приказка",
  description:
    "Персонализирана детска книжка, в която твоите деца са главните герои — по тяхна снимка, име и характер.",
  alternates: { canonical: "/prikazka" },
};

export default function BookWizardPage() {
  return (
    <>
      <MentyHeader />
      <main className="flex-1 bg-background py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BookWizard />
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

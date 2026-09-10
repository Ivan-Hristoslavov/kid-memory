import type { Metadata } from "next";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { Wizard } from "@/components/wizard/wizard";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Създай персонализиран постер",
  description:
    "Създай илюстрован постер по снимка — за дете, колега, двойка или любимец. Виждаш дизайна за минути, плащане при доставка.",
  alternates: { canonical: "/create" },
};

/**
 * `?template=` lets an occasion card or a campaign CTA drop the visitor
 * straight onto the matching form. It is read here rather than with
 * `useSearchParams` in the wizard: the param has to be known on the very first
 * render, and reading it from the page prop is the one place that guarantees
 * that. An unknown value falls through to the picker instead of being trusted.
 */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const raw = (await searchParams).template;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const initialTemplate: TemplateId | null = isTemplateId(requested) ? requested : null;

  return (
    <>
      <MentyHeader />
      <main className="bg-sand flex-1 pt-12 pb-20">
        <Wizard initialTemplate={initialTemplate} />
      </main>
      <MentyFooter />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { Mail } from "lucide-react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { LIFESTYLE } from "@/lib/brand";
import { COMPANY } from "@/lib/legal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Бизнес подаръци",
  description:
    "Брандирани подаръци за екипи, клиенти и партньори — с вашето лого, опаковани и доставени.",
  alternates: { canonical: "/biznes-podaratsi" },
};

const POINTS = [
  {
    title: "Вашето лого, нашата изработка",
    text: "Печат и бродерия върху чаши, текстил и аксесоари, в количества от 10 нагоре.",
  },
  {
    title: "Единна опаковка",
    text: "Брандирана кутия, картичка и хартия — всичко пристига готово за връчване.",
  },
  {
    title: "Доставка до адрес или до всеки поотделно",
    text: "Изпращаме на един адрес или директно до всеки получател.",
  },
];

/**
 * Business gifts is an enquiry page, not a catalogue.
 *
 * Quantities, branding and lead times are negotiated per order, so there is
 * nothing honest to put a price on here. A contact route is the whole page —
 * inventing tiered pricing for volumes we have not quoted would be worse than
 * asking people to write.
 */
export default async function BusinessGiftsPage() {
  const settings = await getSettings();
  const email = settings.contactEmail || COMPANY.email;

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-sand">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                <Image
                  src={LIFESTYLE.box}
                  alt="Брандирана подаръчна кутия Menty"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-2 lg:order-1">
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Подаръци за екипа и клиентите.
              </h1>
              <p className="mt-4 max-w-md text-muted-foreground">
                Едно и също внимание към детайла, в количество. Пишете ни какво
                ви трябва и до колко души — връщаме оферта.
              </p>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent("Запитване за бизнес подаръци")}`}
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
              >
                <Mail className="size-4" strokeWidth={1.5} />
                Изпрати запитване
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <ul className="grid gap-6 sm:grid-cols-3">
            {POINTS.map((p) => (
              <li key={p.title} className="rounded-xl bg-background p-6 ring-1 ring-border">
                <h2 className="font-heading font-bold">{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

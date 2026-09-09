import type { Metadata } from "next";
import Image from "next/image";
import { ImagePlus, PenLine, Sparkles } from "lucide-react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductCard } from "@/components/menty/bestsellers";
import { LIFESTYLE } from "@/lib/brand";
import { personalizable } from "@/lib/shop/products";

export const metadata: Metadata = {
  title: "Персонализирани подаръци",
  description:
    "Добави снимка, име, дата или послание. Отпечатваме и опаковаме по поръчка в България.",
  alternates: { canonical: "/personalizirani" },
};

const STEPS = [
  { icon: ImagePlus, title: "Качи снимка", text: "Една ясна снимка е достатъчна." },
  { icon: PenLine, title: "Добави послание", text: "Име, дата или няколко думи." },
  { icon: Sparkles, title: "Ние поемаме оттам", text: "Печат, опаковка и доставка." },
];

export default function PersonalizedPage() {
  const items = personalizable();

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-sand">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                <Image
                  src={LIFESTYLE.personalize}
                  alt="Чаша, рамка и снимка, подредени за персонализиране"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-2 lg:order-1">
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Направи го уникален.
              </h1>
              <p className="mt-4 max-w-md text-muted-foreground">
                Всеки от продуктите по-долу може да носи снимка, име, дата или
                послание. Изработваме по поръчка в България.
              </p>
              <ul className="mt-8 space-y-4">
                {STEPS.map((s) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-background ring-1 ring-border">
                      <s.icon className="size-4 text-forest" strokeWidth={1.5} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{s.title}</span>
                      <span className="block text-sm text-muted-foreground">{s.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Какво можеш да персонализираш
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

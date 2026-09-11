import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { GIFT_AUDIENCES, GIFT_OCCASIONS } from "@/lib/brand";

export const metadata: Metadata = {
  title: "За повода",
  description: "Подаръци по получател и по повод — за нея, за него, за двойки, за рожден ден, годишнина и просто така.",
  alternates: { canonical: "/za-povoda" },
};

export default function OccasionsIndexPage() {
  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            За повода
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Хората търсят подарък за конкретен човек и конкретен момент. Започни
            оттам.
          </p>

          <Group title="За кого" items={GIFT_AUDIENCES} />
          <Group title="За какъв повод" items={GIFT_OCCASIONS} />
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: readonly { id: string; label: string; image: string }[];
}) {
  return (
    <section className="mt-12">
      <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/za-povoda/${c.id}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-border"
            >
              <Image
                src={c.image}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ground-dark/75 to-transparent p-4 pt-12 font-semibold text-ground-paper">
                {c.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

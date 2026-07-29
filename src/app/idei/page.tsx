import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { ARTICLES } from "@/lib/articles";
import { Eyebrow } from "@/components/landing/shared";

export const metadata: Metadata = {
  title: "Идеи за подаръци за деца",
  description:
    "Идеи за подарък за 1 юни, за баба и дядо, за рожден ден — и защо персонализираният подарък се пази по-дълго от играчката.",
  alternates: { canonical: "/idei" },
};

export default function ArticlesPage() {
  return (
    <>
      <SiteHeader />
      <main className="aura flex-1 px-6 pt-14 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <Eyebrow>Идеи и съвети</Eyebrow>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Подаръци, които се пазят
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              За 1 юни, за баба и дядо, за рожден ден — и малко за думичките, които
              изчезват твърде бързо.
            </p>
          </div>

          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/idei/${a.slug}`} className="group block">
                <article className="glass lift flex h-full flex-col overflow-hidden rounded-3xl">
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Image
                      src={a.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-heading text-lg font-bold leading-snug">{a.title}</h2>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{a.excerpt}</p>
                    <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Clock className="size-4" /> {a.readMinutes} мин четене
                      <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

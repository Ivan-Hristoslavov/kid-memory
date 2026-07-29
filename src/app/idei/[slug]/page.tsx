import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { ARTICLES, getArticle } from "@/lib/articles";
import { COMPANY } from "@/lib/legal";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

/** Every article is known at build time, so they prerender as static pages. */
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/idei/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.published,
      modifiedTime: article.updated,
      images: [{ url: article.image }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const others = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published,
    dateModified: article.updated,
    image: `${SITE_URL}${article.image}`,
    inLanguage: "bg-BG",
    author: { "@type": "Organization", name: COMPANY.brand },
    publisher: { "@type": "Organization", name: COMPANY.brand },
    mainEntityOfPage: `${SITE_URL}/idei/${article.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Идеи", path: "/idei" },
              { name: article.title, path: `/idei/${article.slug}` },
            ])
          ),
        }}
      />
      <SiteHeader />
      <main className="aura flex-1 px-6 pt-10 pb-24">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/idei"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Всички идеи
          </Link>

          <h1 className="mt-5 text-balance font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> {article.readMinutes} мин четене · обновена{" "}
            {new Date(article.updated).toLocaleDateString("bg-BG")}
          </p>

          <div className="elevate-lg relative mt-8 aspect-[3/2] overflow-hidden rounded-3xl">
            <Image
              src={article.image}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-top"
            />
          </div>

          <div className="glass mt-8 rounded-3xl p-8 leading-relaxed">
            {article.body.map((block, i) => (
              <section key={i} className={i > 0 ? "mt-8" : ""}>
                {block.h && (
                  <h2 className="mb-3 font-heading text-xl font-bold">{block.h}</h2>
                )}
                {block.p.map((p, j) => (
                  <p key={j} className="mt-3 text-foreground/85 first:mt-0">
                    {p}
                  </p>
                ))}
              </section>
            ))}

            <div className="mt-10 rounded-2xl bg-secondary/50 p-6 text-center">
              <p className="font-heading text-xl font-bold">
                Направи го със снимката на твоето дете
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Виждаш готовия постер преди да платиш. Плащане при доставка.
              </p>
              <Button asChild size="lg" className="mt-5 rounded-full">
                <Link href="/create">
                  Създай постер <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {others.length > 0 && (
            <div className="mt-12">
              <h2 className="font-heading text-xl font-bold">Още по темата</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/idei/${o.slug}`}
                    className="glass lift block rounded-2xl p-5"
                  >
                    <p className="font-heading font-bold leading-snug">{o.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{o.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "./site-header";
import { Footer } from "./footer";

/** Shared shell for the legal pages: readable column, consistent typography. */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="bg-dreamy flex-1 pt-10 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Начало
          </Link>
          <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Последна редакция: {updated}</p>

          <div
            className="glass mt-8 space-y-5 rounded-3xl p-8 leading-relaxed
              [&_a]:font-semibold [&_a]:text-primary [&_a]:underline
              [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold
              [&_h2:first-child]:mt-0
              [&_li]:ml-5 [&_li]:list-disc [&_p]:text-foreground/85 [&_ul]:space-y-2"
          >
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

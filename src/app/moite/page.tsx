import type { Metadata } from "next";
import Link from "next/link";
import { Download, PackageSearch, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { AccessRequestForm } from "@/components/site/access-request-form";
import { ordersForToken } from "@/app/actions/my-posters";

export const metadata: Metadata = {
  title: "Моите постери",
  description: "Виж своите поръчки и поръчай повторно готов дизайн.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Получена",
  GENERATING: "Изработва се",
  PREVIEW_READY: "Незавършена",
  CONFIRMED: "Потвърдена",
  PRINTING: "В печат",
  SHIPPED: "Изпратена",
  DELIVERED: "Доставена",
  CANCELLED: "Отменена",
};

export default async function MyPostersPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const session = t ? await ordersForToken(t) : null;

  return (
    <>
      <SiteHeader />
      <main className="aura flex-1 px-6 pt-14 pb-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center font-heading text-4xl font-extrabold tracking-tight">
            Моите постери
          </h1>

          {!session ? (
            <>
              <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
                {t
                  ? "Връзката е изтекла или вече не е валидна. Поискай нова."
                  : "Въведи имейла, с който си поръчал. Ще ти изпратим връзка — без парола."}
              </p>
              <div className="mt-8">
                <AccessRequestForm />
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-center text-muted-foreground">{session.email}</p>

              {session.orders.length === 0 ? (
                <p className="mt-10 text-center text-muted-foreground">
                  Няма поръчки на този имейл.
                </p>
              ) : (
                <ul className="mt-10 space-y-4">
                  {session.orders.map((o) => (
                    <li key={o.id} className="glass flex flex-wrap items-center gap-5 rounded-2xl p-5">
                      {o.previewUrl ? (
                        // Short-lived signed URL on a private bucket — nothing
                        // for the image optimiser to cache.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={o.previewUrl}
                          alt={`Постер на ${o.childName}`}
                          className="size-20 rounded-xl object-cover ring-1 ring-black/10"
                        />
                      ) : (
                        <span className="grid size-20 place-items-center rounded-xl bg-muted text-muted-foreground">
                          <Sparkles className="size-6" />
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-bold">
                          Постерът на {o.childName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          №{o.orderNumber} · {STATUS_LABEL[o.status] ?? o.status} ·{" "}
                          {o.createdAt.toLocaleDateString("bg-BG")}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {o.status === "PREVIEW_READY" && (
                          <Button asChild size="sm" className="rounded-full">
                            <Link href={`/order?orderId=${o.id}`}>Завърши</Link>
                          </Button>
                        )}
                        {/* Every product includes the digital file, so a paid
                            customer can take it whenever they need it — the
                            emailed link expires, this page always mints a new
                            one. Plain anchor, not Link: it points at signed
                            storage, not at a route. */}
                        {o.downloadUrl && (
                          <Button asChild size="sm" className="rounded-full">
                            <a href={o.downloadUrl} download>
                              <Download className="size-4" /> Свали файла
                            </a>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <Link href={`/proverka?order=${o.orderNumber}`}>
                            <PackageSearch className="size-4" /> Проследи
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="glass mt-10 rounded-2xl p-7 text-center">
                <p className="font-heading text-lg font-bold">
                  Догодина думичките ще са други
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Същото дете, същият стил, нова възраст. Двата един до друг показват цяла
                  година.
                </p>
                <Button asChild size="lg" className="mt-5 rounded-full">
                  <Link href="/create">Направи новия</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

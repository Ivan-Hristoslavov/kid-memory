import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { Button } from "@/components/ui/button";
import { unsubscribeEmail } from "@/app/actions/campaigns";

export const metadata: Metadata = {
  title: "Отписване",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One-click opt-out from the campaign list. Deliberately requires no
 * confirmation step — a person who clicked "unsubscribe" has already decided,
 * and making them work for it is what gets mail marked as spam.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const done = email ? await unsubscribeEmail(email) : false;

  return (
    <>
      <MentyHeader />
      <main className="bg-dreamy flex flex-1 items-center justify-center px-6 py-24">
        <div className="glass max-w-md rounded-3xl p-10 text-center">
          {done ? (
            <>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-7" />
              </span>
              <h1 className="mt-5 font-heading text-2xl font-extrabold">Отписахме те</h1>
              <p className="mt-3 text-muted-foreground">
                Няма да получаваш повече имейли за поводи. Писмата за твои поръчки
                продължават — те не са реклама.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-extrabold">Нещо не се получи</h1>
              <p className="mt-3 text-muted-foreground">
                Връзката изглежда непълна. Отговори на който и да е наш имейл с „отпиши ме“
                и ще го направим веднага.
              </p>
            </>
          )}
          <Button asChild variant="outline" className="mt-8 rounded-full">
            <Link href="/">Към началото</Link>
          </Button>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isWithinWindow } from "@/lib/campaigns";
import { CampaignList, type CampaignRow } from "@/components/admin/campaign-editor";
import { SeedCampaignsButton } from "@/components/admin/seed-campaigns";

export const metadata: Metadata = {
  title: "Кампании — администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const rows = await prisma.campaign.findMany({
    orderBy: [{ startMonth: "asc" }, { startDay: "asc" }],
  });

  const now = new Date();
  // Only the highest-priority match actually shows, so mark just that one.
  const activeId =
    rows
      .filter(
        (c) =>
          c.enabled && isWithinWindow(now, c.startMonth, c.startDay, c.endMonth, c.endDay)
      )
      .sort((a, b) => b.priority - a.priority)[0]?.id ?? null;

  const campaigns: CampaignRow[] = rows.map((c) => ({
    ...c,
    isActiveNow: c.id === activeId,
  }));

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">Кампании</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Сезонни поводи, които сменят заглавието, лентата горе, цветовете и SEO-то на
              сайта. Периодите се повтарят всяка година — не се пипат отново.
            </p>
          </div>
          {campaigns.length === 0 && <SeedCampaignsButton />}
        </div>

        <div className="mt-8">
          {campaigns.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="font-heading text-lg font-bold">Още няма кампании</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Зареди българския календар с готови текстове за 2 февруари, 8 март, 1 юни,
                Деня на бащата, първия учебен ден, 21 ноември и Коледа. После ги редактирай
                както искаш.
              </p>
            </div>
          ) : (
            <CampaignList campaigns={campaigns} />
          )}
        </div>
      </div>
    </main>
  );
}

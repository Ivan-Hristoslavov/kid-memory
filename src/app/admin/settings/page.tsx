import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { isTestMode } from "@/lib/config";

export const metadata: Metadata = {
  title: "Настройки — администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Настройки</h1>
        <p className="mt-1 text-muted-foreground">
          Промените се записват в базата и се отразяват в сайта веднага.
        </p>

        {isTestMode() && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-destructive/10 p-5 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-bold text-destructive">Тестов режим е включен</p>
              <p className="mt-1 text-foreground/80">
                Админ панелът е <strong>отворен без парола</strong> и прегледите се показват
                в пълно качество. Преди сайтът да е онлайн, сложи{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">TEST_MODE=&quot;false&quot;</code>{" "}
                и силна <code className="rounded bg-muted px-1.5 py-0.5">ADMIN_PASSWORD</code>.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <SettingsForm settings={settings} />
        </div>
      </div>
    </main>
  );
}

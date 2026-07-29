import { getSettings } from "@/lib/settings";
import { AnnouncementBar } from "./announcement-bar";
import { Navbar } from "./navbar";

/** Sticky top of every page: promo strip + navigation. */
export async function SiteHeader() {
  const settings = await getSettings();
  return (
    <header className="sticky top-0 z-50">
      {settings.promoEnabled && (
        <AnnouncementBar text={settings.promoText} secondary={settings.promoSecondary} />
      )}
      <Navbar />
    </header>
  );
}

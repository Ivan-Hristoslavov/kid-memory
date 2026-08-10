import { getSettings } from "@/lib/settings";
import { getActiveCampaign, type ActiveCampaign } from "@/lib/campaigns";
import { AnnouncementBar } from "./announcement-bar";
import { Navbar } from "./navbar";

/**
 * Sticky top of every page: promo strip + navigation.
 *
 * The home page already resolves the campaign, so it passes it down rather than
 * making us look it up again; every other page resolves its own.
 */
export async function SiteHeader({ campaign }: { campaign?: ActiveCampaign | null } = {}) {
  const settings = await getSettings();
  const active = campaign !== undefined ? campaign : await getActiveCampaign();

  return (
    <header className="sticky top-0 z-50">
      {settings.promoEnabled && (
        <AnnouncementBar
          text={active?.promoText ?? settings.promoText}
          secondary={active?.promoSecondary ?? settings.promoSecondary}
        />
      )}
      <Navbar />
    </header>
  );
}

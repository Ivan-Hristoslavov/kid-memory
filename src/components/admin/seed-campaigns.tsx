"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedCampaigns } from "@/app/actions/campaigns";

/** Loads the Bulgarian gift calendar with ready-made copy. */
export function SeedCampaignsButton() {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      className="rounded-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await seedCampaigns();
        setBusy(false);
        if (res.error) toast.error(res.error);
        else toast.success(res.message ?? "Готово.");
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
      Зареди българския календар
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBatchPrintPdf } from "@/app/actions/admin";

/** Builds one PDF of every confirmed, ready-to-print poster and opens it. */
export function BatchPrintButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await generateBatchPrintPdf();
    setBusy(false);
    if (res.error) {
      setMsg({ text: res.error, ok: false });
      return;
    }
    setMsg({ text: res.message ?? "Готово.", ok: true });
    if (res.url) window.open(res.url, "_blank", "noopener");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={run} disabled={busy} variant="outline" className="rounded-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
        Пакетен печат
      </Button>
      {msg && (
        <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-destructive"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}

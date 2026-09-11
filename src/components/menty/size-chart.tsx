"use client";

import { useState } from "react";
import { Ruler, X } from "lucide-react";
import { CARE_INSTRUCTIONS, sizeChart } from "@/lib/shop/sizes";

/**
 * The size table, behind a link rather than laid out on the page.
 *
 * It is a reference, not a decision — most people know their size and the ones
 * who do not need it precisely when they are looking at the size buttons. A
 * link beside those buttons is where it belongs; a table permanently open above
 * them pushes the add-to-cart below the fold for everybody.
 *
 * Shows nothing at all when the supplier publishes no chart for a blank. An
 * invented measurement is worse than none, because somebody buys against it.
 */
export function SizeChartLink({ uid }: { uid: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const chart = sizeChart(uid);
  if (!chart) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        <Ruler className="size-3.5" strokeWidth={1.5} /> Таблица с размери
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Таблица с размери"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-forest/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <button
            type="button"
            aria-label="Затвори"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-6 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-bold">Таблица с размери</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Мерките са на дрехата в сантиметри, положена на равно — не на
                  тялото.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Затвори"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <table className="mt-5 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-semibold">Размер</th>
                  {chart.columns.map((c) => (
                    <th key={c} className="py-2 pr-3 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 font-medium">{row[0]}</td>
                    {row.slice(1).map((v, i) => (
                      <td key={i} className="py-2 pr-3 tabular-nums text-muted-foreground">
                        {v} см
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {chart.care && (
              <div className="mt-6 rounded-lg bg-sand p-4">
                <p className="text-xs font-semibold text-foreground">Поддръжка</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {CARE_INSTRUCTIONS.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

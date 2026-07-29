"use client";

import { motion } from "framer-motion";

export interface Point {
  label: string;
  value: number;
}

/** Bar chart — daily orders / revenue. Pure SVG, no chart library. */
export function BarChart({
  data,
  suffix = "",
  height = 180,
}: {
  data: Point[];
  suffix?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * (height - 26));
          return (
            <div key={d.label + i} className="group relative flex flex-1 flex-col items-center">
              <span className="mb-1 text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {d.value}
                {suffix}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
                className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary"
                style={{ height: h }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span
            key={d.label + i}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal breakdown bars — statuses, products, styles. */
export function BreakdownBars({
  data,
  colorClass = "bg-primary",
}: {
  data: Point[];
  colorClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Няма данни.</p>;
  }
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="text-muted-foreground">{d.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className={`h-full rounded-full ${colorClass}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

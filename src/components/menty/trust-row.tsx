import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";

/**
 * The four promises the reference runs directly under the hero, before any
 * product. Thin line icons, no fills — the brief asks for restraint here and
 * these are reassurance, not decoration.
 */
const ITEMS = [
  { icon: Truck, label: "Бърза доставка" },
  { icon: Sparkles, label: "Високо качество" },
  { icon: ShieldCheck, label: "Сигурно плащане" },
  { icon: Gift, label: "Подаръчна опаковка" },
];

export function TrustRow() {
  return (
    <section className="border-b border-border bg-background">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5">
            <item.icon className="size-5 shrink-0 text-forest" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground/85">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

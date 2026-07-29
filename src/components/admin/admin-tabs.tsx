"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, MessageSquareQuote, Package, Settings } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Поръчки", icon: Package, exact: true },
  { href: "/admin/reviews", label: "Отзиви", icon: MessageSquareQuote },
  { href: "/admin/stats", label: "Статистика", icon: BarChart3 },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5">
      {TABS.map((t) => {
        const active = t.exact
          ? pathname === t.href || pathname.startsWith("/admin/orders")
          : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

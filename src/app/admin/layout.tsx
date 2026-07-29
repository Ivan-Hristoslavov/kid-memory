import Link from "next/link";
import { Heart } from "lucide-react";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
              <Heart className="size-4 fill-current" />
            </span>
            <span className="font-heading font-bold">Админ · Бисерите</span>
          </Link>
          <AdminTabs />
        </div>
      </header>
      {children}
    </div>
  );
}

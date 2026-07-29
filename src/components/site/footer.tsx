import Link from "next/link";
import { Heart, Mail, Phone } from "lucide-react";
import { COMPANY } from "@/lib/legal";
import { HashLink } from "./hash-link";
import { getSettings } from "@/lib/settings";

const NAV = [
  { href: "/create", label: "Създай постер" },
  { href: "/#styles", label: "Стилове" },
  { href: "/#how", label: "Как работи" },
  { href: "/#pricing", label: "Цени" },
  { href: "/idei", label: "Идеи за подаръци" },
  { href: "/otzivi", label: "Отзиви" },
  { href: "/proverka", label: "Провери поръчка" },
];

const LEGAL = [
  { href: "/snimkite", label: "Какво правим със снимката" },
  { href: "/obshti-usloviya", label: "Общи условия" },
  { href: "/poveritelnost", label: "Поверителност" },
  { href: "/vrashtane", label: "Замяна и рекламации" },
  { href: "/biskvitki", label: "Бисквитки" },
];

export async function Footer() {
  const settings = await getSettings();
  const email = settings.contactEmail || COMPANY.email;
  const phone = settings.contactPhone || COMPANY.phone;

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                <Heart className="size-3.5 fill-current" />
              </span>
              <span className="font-heading font-bold">{COMPANY.brand}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Малките думички си отиват тихо. Ние ги превръщаме в спомен, който остава на
              стената — и в сърцето — завинаги.
            </p>
            <div className="mt-5 space-y-1.5 text-sm">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Mail className="size-4" /> {email}
              </a>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="size-4" /> {phone}
                </a>
              )}
            </div>
          </div>

          <nav>
            <p className="font-heading text-sm font-bold">Магазин</p>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV.map((l) => (
                <li key={l.href}>
                  {l.href.includes("#") ? (
                    <HashLink
                      href={l.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {l.label}
                    </HashLink>
                  ) : (
                    <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <p className="font-heading text-sm font-bold">Правна информация</p>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 space-y-2 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          <p>
            {COMPANY.legalName} · ЕИК {COMPANY.eik} · {COMPANY.address}
          </p>
          <p>
            © {new Date().getFullYear()} {COMPANY.brand}. Направено с ❤️ в България.
          </p>
        </div>
      </div>
    </footer>
  );
}

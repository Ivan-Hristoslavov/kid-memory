import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { COMPANY } from "@/lib/legal";
import { getSettings } from "@/lib/settings";
import { GIFT_AUDIENCES } from "@/lib/brand";
import { Logo } from "./logo";

const SHOP = [
  { href: "/produkti", label: "Всички продукти" },
  { href: "/personalizirani", label: "Персонализирани" },
  { href: "/biznes-podaratsi", label: "Бизнес подаръци" },
  { href: "/proverka", label: "Провери поръчка" },
  { href: "/otzivi", label: "Отзиви" },
];

const LEGAL = [
  { href: "/snimkite", label: "Какво правим със снимката" },
  { href: "/obshti-usloviya", label: "Общи условия" },
  { href: "/poveritelnost", label: "Поверителност" },
  { href: "/vrashtane", label: "Замяна и рекламации" },
  { href: "/biskvitki", label: "Бисквитки" },
];

/** Forest ground with the inverse lockup — the identity sheet's dark variant. */
export async function MentyFooter() {
  const settings = await getSettings();
  const email = settings.contactEmail || COMPANY.email;
  const phone = settings.contactPhone || COMPANY.phone;

  return (
    <footer className="bg-forest text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo tone="inverse" showTagline className="text-[1.05rem]" />
            <div className="mt-6 space-y-2 text-sm">
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-ivory/75 transition-colors hover:text-ivory">
                <Mail className="size-4" strokeWidth={1.5} /> {email}
              </a>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-ivory/75 transition-colors hover:text-ivory">
                  <Phone className="size-4" strokeWidth={1.5} /> {phone}
                </a>
              )}
            </div>
          </div>

          <FooterNav title="Магазин" links={SHOP} />
          <FooterNav
            title="За повода"
            links={GIFT_AUDIENCES.map((a) => ({
              href: `/za-povoda/${a.id}`,
              label: a.label,
            }))}
          />
          <FooterNav title="Правна информация" links={LEGAL} />
        </div>

        <div className="mt-12 space-y-2 border-t border-ivory/15 pt-8 text-center text-xs text-ivory/60">
          <p>
            {COMPANY.legalName} · ЕИК {COMPANY.eik} · {COMPANY.address}
          </p>
          <p>
            © {new Date().getFullYear()} {COMPANY.brand}. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterNav({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ivory/70 transition-colors hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

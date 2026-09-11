import Link from "next/link";
import { Mail, Package, Phone, Truck, Wallet } from "lucide-react";
import { COMPANY } from "@/lib/legal";
import { getSettings } from "@/lib/settings";
import { formatPrice, DELIVERY } from "@/lib/catalog";
import { GIFT_AUDIENCES } from "@/lib/brand";
import { Logo } from "./logo";

const SHOP = [
  { href: "/produkti", label: "Всички продукти" },
  { href: "/dizaini", label: "Готови дизайни" },
  { href: "/za-povoda", label: "За повода" },
  { href: "/create", label: "Постер по снимка" },
  { href: "/prikazka", label: "Детска книжка" },
  { href: "/personalizirani", label: "Как работи" },
  { href: "/biznes-podaratsi", label: "Бизнес подаръци" },
  { href: "/tarsene", label: "Търсене" },
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

/**
 * Forest ground with the inverse lockup — the identity sheet's dark variant.
 *
 * The band above the columns carries the three facts a visitor looks for at
 * the bottom of a shop rather than at the top: who delivers, how you pay, and
 * when delivery stops costing anything. They are read from the catalogue, so a
 * change to the free-delivery threshold cannot leave a stale promise here.
 *
 * No social links and no newsletter box: there are no accounts behind either,
 * and a footer full of dead icons is worse than a short one.
 */
export async function MentyFooter() {
  const settings = await getSettings();
  const email = settings.contactEmail || COMPANY.email;
  const phone = settings.contactPhone || COMPANY.phone;

  /* ground-dark/ground-paper, not forest/ivory. `--forest` LIGHTENS to 0.72 in
     dark mode while `--ivory` stays near-white, which put ivory text on a pale
     green footer at 2.16:1 — measured, not guessed; scripts/type-audit.ts. The
     footer is a brand surface like the shirt grounds in the design catalogue,
     so it takes the tokens that do not move: dark green with ivory on it,
     13.7:1, in both themes. */
  return (
    <footer className="bg-ground-dark text-ground-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid gap-4 border-b border-ground-paper/15 py-8 sm:grid-cols-3">
          <Fact icon={Truck} title="Еконт и Спиди">
            До офис, автомат или адрес
          </Fact>
          <Fact icon={Wallet} title="Наложен платеж">
            Плащаш при получаване
          </Fact>
          <Fact icon={Package} title={`Безплатна доставка над ${formatPrice(DELIVERY.freeAboveEUR)}`}>
            Иначе {formatPrice(DELIVERY.feeEUR)}
          </Fact>
        </ul>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-14">
          <div>
            <Logo tone="inverse" showTagline className="text-[1.05rem]" />
            <div className="mt-6 space-y-2 text-sm">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-ground-paper/75 transition-colors hover:text-ground-paper"
              >
                <Mail className="size-4" strokeWidth={1.5} /> {email}
              </a>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-ground-paper/75 transition-colors hover:text-ground-paper"
                >
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

        <div className="flex flex-col gap-2 border-t border-ground-paper/15 py-8 text-xs text-ground-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {COMPANY.legalName} · ЕИК {COMPANY.eik} · {COMPANY.address}
          </p>
          <p>
            © {new Date().getFullYear()} {COMPANY.brand}
          </p>
        </div>
      </div>
    </footer>
  );
}

function Fact({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-ground-paper/70" strokeWidth={1.5} />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-ground-paper/60">{children}</span>
      </span>
    </li>
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
            <Link
              href={l.href}
              className="text-ground-paper/70 transition-colors hover:text-ground-paper"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

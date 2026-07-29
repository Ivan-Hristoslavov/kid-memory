import "server-only";
import { Resend } from "resend";
import {
  ADDONS,
  addonPriceEUR,
  formatPrice,
  PRODUCTS,
  type AddonId,
  type ProductId,
} from "@/lib/catalog";

/**
 * Transactional email via Resend. Fails soft in development:
 * without RESEND_API_KEY, emails are logged instead of sent.
 */

let resend: Resend | null = null;

function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = () => process.env.EMAIL_FROM || "Бисерите на моето дете <onboarding@resend.dev>";

/** Customer names and child names end up inside HTML — always escape them. */
function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string, strong = false): string {
  const v = strong ? `<strong>${value}</strong>` : value;
  return `<tr><td style="padding:6px 0;color:#8a7d99;">${esc(label)}</td><td style="text-align:right;">${v}</td></tr>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:26px 0;"><a href="${esc(href)}" style="display:inline-block;background:#e07189;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-size:16px;">${esc(label)}</a></p>`;
}

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="bg"><body style="margin:0;background:#fdf9f4;font-family:Georgia,serif;color:#4a3b5c;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:24px;padding:36px 32px;box-shadow:0 8px 32px rgba(74,59,92,0.08);">
      <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#c98a8a;margin:0 0 12px;">Бисерите на моето дете</p>
      <h1 style="font-size:26px;margin:0 0 20px;">${title}</h1>
      ${body}
      <p style="margin-top:32px;font-size:14px;color:#8a7d99;">С обич,<br/>Екипът на „Бисерите на моето дете" ❤️</p>
    </div>
  </div></body></html>`;
}

export interface OrderEmailData {
  orderNumber: number;
  customerName: string;
  email: string;
  productType: ProductId;
  childName: string;
  courier?: string | null;
  trackingNumber?: string | null;
  /** Amount the courier collects — repeated on shipping so it never surprises. */
  totalEUR?: number | null;
}

export interface OrderReceivedEmailData extends OrderEmailData {
  addons: string[];
  /** Product plus add-ons, before delivery. */
  subtotalEUR: number;
  /** 0 when the order qualifies for free delivery. */
  deliveryEUR: number;
  /** What the courier actually collects. */
  totalEUR: number;
  deliveryDays: string;
  /** One-click confirmation link; printing waits for it. */
  confirmUrl: string;
  trackUrl: string;
}

export async function sendOrderReceivedEmail(data: OrderReceivedEmailData): Promise<void> {
  const product = PRODUCTS[data.productType];
  const addonRows = data.addons
    .map((id) => {
      const a = ADDONS[id as AddonId];
      return a ? row(a.name, formatPrice(addonPriceEUR(id as AddonId, data.productType))) : "";
    })
    .join("");

  await deliver(
    data.email,
    `Поръчка №${data.orderNumber} — потвърди я, за да я пуснем за печат`,
    shell(
      "Получихме твоята поръчка ❤️",
      `<p style="font-size:16px;line-height:1.6;">Здравей, ${esc(data.customerName)}!</p>
       <p style="font-size:16px;line-height:1.6;">Спомен №<strong>${esc(data.orderNumber)}</strong> за <strong>${esc(data.childName)}</strong> вече е при нас.</p>

       <table style="width:100%;font-size:15px;margin:20px 0;border-collapse:collapse;">
         ${row(product.name, formatPrice(product.priceEUR))}
         ${addonRows}
         ${row("Доставка", data.deliveryEUR === 0 ? "безплатна" : formatPrice(data.deliveryEUR))}
       </table>

       <div style="background:#fdf3f5;border-radius:16px;padding:18px 20px;margin:20px 0;">
         <p style="margin:0;font-size:15px;color:#8a7d99;">За плащане на куриера</p>
         <p style="margin:4px 0 0;font-size:28px;font-weight:700;">${formatPrice(data.totalEUR)}</p>
         <p style="margin:8px 0 0;font-size:14px;color:#8a7d99;">Наложен платеж — плащаш в брой или с карта при получаване.</p>
       </div>

       <p style="font-size:16px;line-height:1.6;">Постерът е персонализиран, затова не го пускаме за печат, преди ти да кажеш „да“:</p>
       ${button(data.confirmUrl, "Потвърждавам поръчката")}
       <p style="font-size:14px;line-height:1.6;color:#8a7d99;">След потвърждението изработваме и изпращаме за ${esc(data.deliveryDays)}.
       Ако нещо в поръчката не е наред — просто отговори на този имейл.</p>
       <p style="font-size:14px;line-height:1.6;color:#8a7d99;">Проследяване по всяко време: <a href="${esc(data.trackUrl)}" style="color:#e07189;">${esc(data.trackUrl)}</a></p>`
    )
  );
}

/**
 * On-demand "keep this for later" link, sent while the visitor is still in the
 * wizard. Different from the automatic recovery mail: this one they asked for,
 * so it is warmer and carries no nudge to buy.
 */
export async function sendDraftLinkEmail(data: {
  email: string;
  childName: string;
  resumeUrl: string;
}): Promise<void> {
  await deliver(
    data.email,
    `Постерът на ${data.childName} е запазен`,
    shell(
      "Запазихме постера ти",
      `<p style="font-size:16px;line-height:1.6;">Постерът на <strong>${esc(data.childName)}</strong> те чака.
       Отвори връзката, когато си готов — нищо няма да се загуби.</p>
       ${button(data.resumeUrl, "Продължи оттам, докъдето стигна")}
       <p style="font-size:14px;line-height:1.6;color:#8a7d99;">Ако линкът не се отваря, копирай този адрес:<br/>
       <span style="word-break:break-all;">${esc(data.resumeUrl)}</span></p>`
    )
  );
}

/**
 * Recovery for a poster that was generated but never ordered. The customer has
 * already seen their child's illustration, so the emotional work is done —
 * this just puts it back in front of them.
 */
export async function sendRecoveryEmail(data: {
  email: string;
  childName: string;
  resumeUrl: string;
}): Promise<void> {
  await deliver(
    data.email,
    `Постерът на ${data.childName} те чака ❤️`,
    shell(
      `Постерът на ${esc(data.childName)} е готов`,
      `<p style="font-size:16px;line-height:1.6;">Здравей!</p>
       <p style="font-size:16px;line-height:1.6;">Направи постер за <strong>${esc(data.childName)}</strong>, но не завърши поръчката.
       Пазим го — готов е и те чака.</p>
       <p style="font-size:16px;line-height:1.6;">Днешните думички ги няма след година. Този постер ги задържа.</p>
       ${button(data.resumeUrl, "Виж постера и поръчай")}
       <p style="font-size:14px;line-height:1.6;color:#8a7d99;">Плащаш при доставка — нищо не се удържа предварително.
       Ако си размислил, просто игнорирай този имейл; повече няма да ти пишем за него.</p>`
    )
  );
}

export async function sendShippedEmail(data: OrderEmailData): Promise<void> {
  await deliver(
    data.email,
    "Твоят спомен вече пътува към теб 🚚",
    shell(
      "Твоят спомен вече пътува към теб",
      `<p style="font-size:16px;line-height:1.6;">Здравей, ${esc(data.customerName)}!</p>
       <p style="font-size:16px;line-height:1.6;">Поръчка №<strong>${esc(data.orderNumber)}</strong> е предадена на куриера.</p>
       <table style="width:100%;font-size:15px;margin:20px 0;border-collapse:collapse;">
         ${row("Куриер", esc(data.courier === "SPEEDY" ? "Спиди" : "Еконт"))}
         ${row("Товарителница", esc(data.trackingNumber ?? "—"), true)}
         ${data.totalEUR != null ? row("За плащане на куриера", formatPrice(data.totalEUR), true) : ""}
       </table>
       <p style="font-size:16px;line-height:1.6;">Плащането е при доставка (наложен платеж). Подготви се за усмивки! 😊</p>`
    )
  );
}

/**
 * Internal heads-up so a new order is never missed. Sent to OWNER_EMAIL
 * (falls back to EMAIL_FROM's address); silently skipped if unset.
 */
export async function sendOwnerNewOrderEmail(data: {
  orderNumber: number;
  childName: string;
  customerName: string;
  phone: string;
  productName: string;
  total: string;
  addons: string[];
  adminUrl: string;
}): Promise<void> {
  const to = process.env.OWNER_EMAIL;
  if (!to) return;
  await deliver(
    to,
    `Нова поръчка №${data.orderNumber} — ${data.total}`,
    shell(
      `Нова поръчка №${data.orderNumber}`,
      `<table style="width:100%;font-size:15px;margin:8px 0 20px;border-collapse:collapse;">
         ${row("Дете", esc(data.childName))}
         ${row("Клиент", `${esc(data.customerName)} · ${esc(data.phone)}`)}
         ${row("Продукт", esc(data.productName))}
         ${data.addons.length ? row("Добавки", esc(data.addons.join(", "))) : ""}
         ${row("Сума", esc(data.total), true)}
       </table>
       ${button(data.adminUrl, "Отвори поръчката")}`
    )
  );
}

/**
 * Operational alert to the owner. Silently skipped without OWNER_EMAIL, and
 * never throws — an alert failing must not take down the request that raised it.
 */
export async function sendOwnerAlertEmail(data: {
  subject: string;
  body: string;
  detail?: string;
}): Promise<void> {
  const to = process.env.OWNER_EMAIL;
  if (!to) return;
  try {
    await deliver(
      to,
      `⚠️ ${data.subject}`,
      shell(
        data.subject,
        `<p style="font-size:16px;line-height:1.6;">${esc(data.body)}</p>
         ${
           data.detail
             ? `<pre style="white-space:pre-wrap;background:#f6f2f8;border-radius:12px;padding:14px;font-size:13px;color:#4a3b5c;">${esc(data.detail)}</pre>`
             : ""
         }`
      )
    );
  } catch (err) {
    console.error("Owner alert failed:", err);
  }
}

async function deliver(to: string, subject: string, html: string): Promise<void> {
  const c = client();
  if (!c) {
    console.info(`[email:dev] to=${to} subject="${subject}" (RESEND_API_KEY not set — not sent)`);
    return;
  }
  const { error } = await c.emails.send({ from: FROM(), to, subject, html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

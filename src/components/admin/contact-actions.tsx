"use client";

import { MessageSquare, Phone, Mail } from "lucide-react";

/**
 * Call / SMS / email the customer straight from the admin.
 *
 * On a Mac a `tel:` link rings through the paired iPhone via Handoff (or
 * FaceTime Audio), and `sms:` opens Messages — so the owner never has to retype
 * a number to chase a confirmation or a refused parcel.
 */
function normalise(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("359")) return `+${digits}`;
  if (digits.startsWith("0")) return `+359${digits.slice(1)}`;
  return `+${digits}`;
}

export function ContactActions({
  phone,
  email,
  orderNumber,
  size = "sm",
}: {
  phone?: string | null;
  email?: string | null;
  orderNumber: number;
  size?: "sm" | "md";
}) {
  const tel = phone ? normalise(phone) : null;
  const box = size === "md" ? "size-10" : "size-8";
  const icon = size === "md" ? "size-4.5" : "size-4";

  const sms = tel
    ? `sms:${tel}&body=${encodeURIComponent(
        `Здравейте! Пиша Ви за поръчка №${orderNumber} от „Бисерите на моето дете“.`
      )}`
    : null;

  return (
    <div className="flex items-center gap-1.5">
      {tel && (
        <a
          href={`tel:${tel}`}
          title={`Обади се на ${phone}`}
          aria-label={`Обади се на ${phone}`}
          className={`${box} grid place-items-center rounded-full bg-emerald-100 text-emerald-800 transition-colors hover:bg-emerald-200`}
        >
          <Phone className={icon} />
        </a>
      )}
      {sms && (
        <a
          href={sms}
          title="Изпрати SMS"
          aria-label="Изпрати SMS"
          className={`${box} grid place-items-center rounded-full bg-sky-100 text-sky-900 transition-colors hover:bg-sky-200`}
        >
          <MessageSquare className={icon} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Поръчка №${orderNumber}`)}`}
          title={`Пиши на ${email}`}
          aria-label={`Пиши на ${email}`}
          className={`${box} grid place-items-center rounded-full bg-violet-100 text-violet-900 transition-colors hover:bg-violet-200`}
        >
          <Mail className={icon} />
        </a>
      )}
    </div>
  );
}

/**
 * When a gift ordered now would actually arrive.
 *
 * Gifting is deadline-driven — people are buying for a date, not for
 * themselves — and the homepage said nothing about when anything turns up.
 * "1–3 работни дни" is the honest production figure but it makes the reader do
 * arithmetic; a weekday name does not.
 *
 * Deliberately the pessimistic end of the range plus a courier day, so the
 * promise on the page is one the shop can keep on its slowest week. Weekends
 * are skipped because neither the print shop nor the couriers work them; public
 * holidays are NOT modelled, which is why the copy says "около" and never
 * prints an exact date.
 */
const PRODUCTION_WORKING_DAYS = 3;
const COURIER_WORKING_DAYS = 1;

const WEEKDAYS = [
  "неделя",
  "понеделник",
  "вторник",
  "сряда",
  "четвъртък",
  "петък",
  "събота",
] as const;

/** Adds working days, skipping Saturday and Sunday. */
function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
}

const MONTHS = [
  "януари", "февруари", "март", "април", "май", "юни",
  "юли", "август", "септември", "октомври", "ноември", "декември",
] as const;

export interface DeliveryEstimate {
  /** "четвъртък" — what the homepage shows. */
  weekday: string;
  /**
   * "четвъртък, 17 септември" — what a product page shows.
   *
   * A weekday alone is enough on the homepage, where the point is that a gift
   * arrives soon. On a product page the question is sharper — "will it be here
   * for Saturday" — and a date answers it where a weekday leaves the reader
   * counting which week is meant.
   */
  label: string;
  /** ISO date, for a <time> element. */
  iso: string;
  /** True when the arrival is more than a week out, so copy can soften. */
  distant: boolean;
}

/**
 * `now` is injectable so this can be tested and so a server render and a client
 * render can be handed the same instant rather than disagreeing across
 * midnight.
 */
export function deliveryEstimate(now: Date = new Date()): DeliveryEstimate {
  const arrival = addWorkingDays(
    now,
    PRODUCTION_WORKING_DAYS + COURIER_WORKING_DAYS
  );
  const daysOut = Math.round(
    (arrival.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );
  return {
    weekday: WEEKDAYS[arrival.getDay()],
    label: `${WEEKDAYS[arrival.getDay()]}, ${arrival.getDate()} ${MONTHS[arrival.getMonth()]}`,
    iso: `${arrival.getFullYear()}-${String(arrival.getMonth() + 1).padStart(2, "0")}-${String(arrival.getDate()).padStart(2, "0")}`,
    distant: daysOut > 7,
  };
}

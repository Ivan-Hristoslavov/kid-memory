# What is left

Checked against the code on 2026-09-10, not from memory. Ordered by what stands
between the shop and its first real order.

## A. Blocks the first sale

**1. No print file is ever produced.**
A basket line stores a `Placement` — the artwork's centre, scale and feather as
fractions — deliberately, so the print can be re-rendered from the original
upload at full resolution rather than from the 1600px screen copy. Nothing
renders it. There is no `lib/print`, and `artworkUrl` appears only in the POD
types and the product panel. Until this exists there is nothing to hand a
printer, whatever else works.

**2. Nothing reaches the printer.**
`activePodProvider()` and `createOrder()` are called from nowhere outside
`lib/pod` itself. Checkout writes the order to our database and stops. Even
wired up it would fail: `createOrder` needs a numeric `product_id` that already
exists in their catalogue, and the only thing that creates one is `/v2/crt-spd`
— the panel route, not the documented API. See `printondemand-panel.md`.

**3. Two settings missing in their panel** (yours to do, not mine).
`/api/deliveries` is empty, so there is no sender profile — that is what a
courier label is issued against. `/api/recipients` is empty, so no invoice
recipient is set.

**4. Company details are empty strings.**
`NEXT_PUBLIC_COMPANY_NAME`, `_EIK`, `_ADDRESS`, `_EMAIL`, `_PHONE` are all `""`.
The terms, the privacy page and every order email render blanks where a
Bulgarian company's identification legally has to appear.

**5. The print field is unverified.**
Their editor implies 377 x 571 mm on a men's t-shirt front. It is the number the
customer is shown and the number a DPI warning is computed from. One sample
order settles it.

## B. Hygiene

**6. Both API tokens are still live.**
PrintFactory and printondemand.bg were both pasted in plain text. Rotate them.

**7. Forty-six commits exist on one machine.**
Nothing is pushed. Every design, every mock-up, the whole restructure.

**8. No production build has been run.**
The dev server has been up throughout, and `next build` against a running dev
server corrupts `.next`. Stop it, build, and confirm — `dynamicParams = false`
in particular only takes effect in a production build, so the 404s for dead
product URLs are unverified.

## C. Half-built

**9. The children's book stops after the story.**
`createBook` writes a validated story and its page rows. The illustration worker,
the progress view, per-page regeneration, the page-flip preview, the print-ready
A5 PDF and the order flow are all absent.

**10. Embroidery can be bought but not fulfilled.**
Designs, pricing and the polo exist. Telling the printer to stitch rather than
print is the same blocker as (2), plus a `.DST` file per design, which is their
digitising service at 5.50 each.

## D. Deliberately deferred

- **English.** Never started. It is `[locale]` routing, dictionaries, hreflang,
  email templates and the legal text — a project, not a task.
- **Reviews are empty on purpose.** Inventing them is unlawful in Bulgaria and
  the EU.
- **`main` vs `redesign`.** The production database already has the `OrderLine`
  and `Book` tables while `main` has none of the code that uses them.

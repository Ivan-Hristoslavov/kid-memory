# What is left

Checked against the code on 2026-09-11, not from memory. Ordered by what stands
between the shop and its first real order.

## A. Blocks the first sale

**1. ~~No print file is ever produced.~~ Done.**
`lib/print/render.ts` produces a PNG at the print area's true millimetre size at
300 DPI, re-rendered from the original upload rather than from the preview.
Lettering is converted to outlines, because librsvg ignores `@font-face` and the
Cyrillic would be the first thing to fall back. `/admin/print/[lineId]`
downloads it behind the existing admin auth.

**2. Nothing reaches the printer.** *(Half-open: the file now exists, the
automatic hand-off does not.)*
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

**7. ~~Forty-six commits exist on one machine.~~ Done.**
Forty-eight commits merged to `main` and pushed. Work continues on
`launch-prep`.

**8. ~~No production build has been run.~~ Done.**
Builds clean, 216 product pages prerendered, and `dynamicParams = false`
verified against a production server: `/produkt/photo-puzzle-a4` and any other
dead id return 404, live ones 200.

Worth knowing for next time: prerendering exhausts the Supabase session pooler
(`pool_size: 15`) and the log fills with `EMAXCONNSESSION`. The build still
succeeds. Port 6543, the transaction pooler, is the fix.

## C. Half-built

**9. The children's book stops after the story.**
`createBook` writes a validated story and its page rows. The illustration worker,
the progress view, per-page regeneration, the page-flip preview, the print-ready
A5 PDF and the order flow are all absent.

**10. Embroidery can be bought but not fulfilled.**
Designs, pricing and the polo exist. Telling the printer to stitch rather than
print is the same blocker as (2), plus a `.DST` file per design, which is their
digitising service at 5.50 each.

**11. Six of the seven print faces set Bulgarian in Russian letterforms.**
Found by `scripts/type-audit.ts`, which is now the BGR test in runnable form.
Of the faces in `assets/fonts`, only Manrope declares a BGR language system in
its GSUB; Oswald, Russo One, Pattaya, Neucha and Playfair carry no `cyrl`
script at all, and Nunito has `cyrl` without BGR. They all have Cyrillic
glyphs — just the Russian shapes of д, и, к, л, п, т, ц, ш and щ.

This is not a bug to fix, it is a substitution to decide. A website in the
wrong letterforms is a shame; a *shirt* in them is a printed object somebody
wears, and it is the sort of thing a Bulgarian notices and a foreigner never
does. But swapping the faces redraws all 105 lettering designs, and the free
display faces that do carry BGR are a much shorter list. Worth doing
deliberately, with the designs re-rendered and looked at, rather than as a
side effect of something else.

The site's own two faces are fine: Manrope passes here, and Spectral was
verified in the browser by rendering the same string at `lang="ru"` and
`lang="bg"` and seeing them differ. Google's faces arrive as woff2, which
opentype.js cannot open, so the script covers the print side and the browser
covers the site side.

## D. Deliberately deferred

- **English.** Never started. It is `[locale]` routing, dictionaries, hreflang,
  email templates and the legal text — a project, not a task.
- **Reviews are empty on purpose.** Inventing them is unlawful in Bulgaria and
  the EU.
- **`main` vs `redesign`.** The production database already has the `OrderLine`
  and `Book` tables while `main` has none of the code that uses them.

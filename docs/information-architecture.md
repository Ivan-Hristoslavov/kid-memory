# How the best gifting sites are arranged, and what ours copies

Read from the live navigation of Moonpig and Papier on 2026-09-11, not recalled.

## What they actually do

**Moonpig** — the URL is a facet path, and every combination is a page.

```
/personalised-cards/birthday/for-her/
 └ product type ── occasion ── recipient
```

Product type is the top level. Occasion is the second. Recipient is the third,
and it is a CHILD of the occasion rather than a sibling of it: "For Mum" appears
under Birthday, under Anniversary, under Christmas, each its own page. Below
that sit attributes — Photo Upload, Funny, Rude — and specific milestones: 1st,
16th, 18th, 30th, 40th, 50th, 60th, 70th, 80th. There is an A-to-Z of
recipients. Every menu column ends with "Shop All".

**Papier** — format first, then use.

```
/stationery/notebooks/lined-notebooks/
/stationery/journals/recipe-journals/
/photos/photo-books/all-books/wedding-anniversary
```

Notebooks split by binding and material; journals split by what you write in
them; photo books split by occasion. Every column ends with "Explore X".

## The three things both do that we did not

**1. The facets cross.** We had three flat lists that never met: products by
type, designs by theme, occasions by date. Nothing let somebody say "a birthday
present, for my mother". Moonpig's entire catalogue is that sentence.

**2. Occasion leads.** Ours was one nav item among four. On Moonpig it is the
spine of every menu, because "it's her birthday on Tuesday" is the thought
people arrive with — the product is a consequence, not the starting point.

**3. Every column has a floor.** "Shop All Birthday", "Explore Notebooks". A
menu that lists eight of forty things and no way to see the rest is a dead end
in a dropdown.

## What ours is now

```
ПОДАРЪЦИ ▾     occasion first, recipient under it, "виж всички" at the foot
ТЕНИСКИ ▾      the ready-made range by theme
ПРОДУКТИ ▾     by what the thing is
[ Създай свой ]  the editor, as an action
```

And the facets cross: `/za-povoda/birthday/for-her` is a real page, generated
for every occasion and audience that has products in common. That is the long
tail Moonpig owns — "подарък за рожден ден за нея" is what somebody types, and
until now the site had no page that said it back to them.

## What is deliberately not copied

**Milestone ages.** Moonpig runs 1st through 80th as separate pages because a
card range genuinely differs by age. A printed mug does not, and forty pages
that differ only in a heading are the kind of thin content that earns a penalty
rather than a ranking.

**A-to-Z of recipients.** Worth having at ten times the catalogue size. At
twenty-seven products it would list the same items under sixty headings.


## Where ours goes further than theirs

Copying an arrangement is the floor, not the ceiling. Two things this shop can
do that a card shop structurally cannot:

**A design is an attribute, not a product.** On Moonpig a birthday card with a
dog on it is one SKU; wanting the dog on a mug is a different search and
probably a different shop. Here a design is an attribute of any of twenty-seven
products, so every ready-made page carries "Същият дизайн върху" — the same
artwork on a mug, a tote, a hoodie, a cap, stickers, a poster, cheapest first,
so one decision ("I like this") becomes a choice of price point rather than a
dead end. It needs no new routes: `/produkt/<blank>?design=<id>` has worked
since the design catalogue existed and was simply never surfaced.

**A set is the unit, not the item.** Somebody looking at "Кумът" is buying for a
stag weekend and needs five more shirts, not one. "За същата компания" shows the
rest of the roles from the same category, which is also the shortest route to
the quantity tier. Moonpig sells one card to one person; this market buys six
shirts at once and the page should behave like it knows that.

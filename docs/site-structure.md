# Why the site felt scattered, and what it is now

Written after the owner said he could not orient himself in his own shop. That
is a real symptom with a specific cause, and it is worth naming before the fix.

## The cause: one idea, three homes

The site grew three separate browsing systems, and they overlapped.

| Idea | Lived at | And also at | And also at |
| --- | --- | --- | --- |
| Гейминг | `/za-povoda/theme-gaming` | `/dizaini/gaming` | — |
| Рожден ден | `/za-povoda/birthday` | `/za-povoda/theme-birthday` | `/dizaini/holiday` |
| Ергенско | `/za-povoda/theme-bachelor` | `/dizaini/bachelor` | — |
| За деца | `/za-povoda/for-kids` | `/za-povoda/theme-kids` | — |

`/za-povoda` was carrying three different questions at once — WHO is it for,
WHAT is the occasion, and WHAT WORLD is it from — under one route, with ids in
two different shapes (`for-her` beside `theme-gaming`). A visitor could not tell
which door to use, and neither could the person who built it.

## The bigger mistake, fixed after the first pass

Everything routed through an editor. Pick a blank, pick a design, place it,
choose a font — and only then buy. That is the wrong default: most people do not
want to design anything. They want the shirt that says "Кумът", in black, size
L, delivered. The competition sells exactly that, as a product with a price and
an add-to-cart button and no step in between.

So every design is now also a product. `t-<designId>` is a ready-made shirt with
a title, a price, three colours and a size — no upload, no placement, no editor.
A lettering design with a `{name}` slot keeps one field, because "Кумът Мартин"
is worth an input; nothing else survives.

None of them has a picture. The card, the gallery and the basket thumbnail all
composite the same three layers the preview uses — colour, artwork, the
supplier's greyscale render — so a hundred and sixty shirts cost a hundred and
sixty lines rather than a hundred and sixty files to generate and keep in step.

The editor did not go away. It became a button: **Създай свой**, beside the
navigation rather than inside it, because it is an action and not a place.

## The rule now

Every page answers exactly one question, and each question has one home.

```
READY TO BUY          /dizaini           160 finished shirts, by category
SOMETHING TO PERSONALISE  /produkti      the blanks, and the editor — the "Създай свой" button
WHO / WHEN            /za-povoda         audiences and occasions, in two labelled sections
```

Then the two things the shop makes itself, which are products rather than
browsing routes:

```
/create        the illustrated poster
/prikazka      the personalised children's book
```

And one audience that shops differently enough to need its own page:

```
/biznes-podaratsi   corporate, quantity, one logo across a range
```

Everything else is support: `/idei`, `/otzivi`, `/snimkite`, `/proverka`,
`/moite`, and the legal set. None of those belong in the main navigation, and
they are not in it.

## What changed

- **The theme collections are gone.** `theme-gaming`, `theme-bachelor` and the
  rest duplicated design categories. Their ids redirect to `/dizaini/*` so no
  link that ever existed breaks.
- **`/za-povoda` is split in two on the page**, "За кого" and "За повода", so
  the two questions it answers are visibly two questions.
- **A design category shows the products that suit it**, which is where the
  theme tags went — they now do a useful job instead of running a parallel
  collection system.
- **The header is five items**, down from six, and the sixth (business gifts)
  moved to the footer where a company buyer will look anyway.

## The shape to keep

Three doors in, two own products, one B2B page. When something new is added, it
answers one of the three questions or it is a product — and if it answers two,
it belongs in whichever one a customer would say out loud.

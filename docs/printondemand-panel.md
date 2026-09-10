# printondemand.bg — how a personalised product actually gets made

The public CLIENT API v2.2 cannot create one. The web panel can, and this is how.
Written down after reading the panel's own JavaScript on 2026-09-10, so that the
question to their support is a specific one rather than "does this exist".

## What the public API is, exactly

Its machine-readable form is at `/rest-api/insomnia.json` — an Insomnia export,
easier to diff than the HTML. It lists **32 requests and no more**:

| Group | Endpoints |
| --- | --- |
| Nomenclatures | colors, sizes, manufacturers, print-types, delivery/signature, delivery/couriers, delivery/location-types, order/payments, order/status |
| Delivery | `GET /api/deliveries` (sender profiles) |
| Payments | `GET /api/recipients`, `POST /api/recipients/set` |
| Catalogue | `GET /api/extra/types`, `GET /api/extra/stikers`, `GET /api/products`, `GET /api/fulfilment-products` |
| Labels | `GET /api/labels`, `POST /api/labels/request` |
| Order | `POST /api/checkout/checkout` × 6 variants |

Not one of them takes a design file. `/api/labels/request` orders sewn-in brand
labels, not artwork. So the API can reorder products that already exist in the
account's catalogue — and the account currently has zero.

## What the panel does that the API does not

`/v2/catalog/create` lists the blanks; each links to `/v2/catalog/create/<slug>`
(mug = `bejdh`, ceramic; `c` men's tee, `ce` women's tee, `ge` kids' tee,
`gdab` baby bodysuit, `hejg` enamel mug, `gehah` magic mug, `bbagb|bbagi|bbahe`
stickers 5/7/10 cm, `bbfcc` cardboard box).

That page is a Vue component, `Catalog/CreateProduct.vue`, and it talks to short
session-authenticated routes rather than `/api/*`:

| Route | Purpose |
| --- | --- |
| `POST /v2/crt-p` | the blank list |
| `POST /v2/crt-pc` | one blank's data: manufacturers, collections, colours, print positions, canvas geometry |
| `POST /v2/crt-pc-sm` | re-read after choosing a manufacturer |
| `POST /v2/crt-cpt` | live price for the current design |
| `POST /v2/crt-spd` | **save — this is the one that creates the product** |

### There is no upload endpoint, and that is good news

The file input accepts `image/png` only, and the handler never posts the file
anywhere. It reads it with `FileReader.readAsDataURL`, hands the data URL to a
fabric.js canvas, and the base64 travels inside the single save request:

```js
final_files = added_files.map(f => ({
  position, width, height,
  src,                       // the artwork, as a data: URL
  id,
  file_type: f.file_type || 'image',
  emid: f.object_ref ? f.object_ref.embroidery_id : null,
}));

// plus one html2canvas snapshot per print position, for the shop mockup
final_images.push({ src: canvas.toDataURL('image/png'), position, index });

POST /v2/crt-spd {
  _token,                    // window.Laravel.csrfToken
  _u: '<blank slug>',
  m: manufacturerId, c: collectionId, h: colourId,
  name,                      // ≥ 5 characters, validated client-side
  images: final_images,
  files:  final_files,
}
```

Which means the whole flow is reproducible server-side from Node: no multipart,
no browser, no design editor. We already compute placement ourselves
(`lib/shop/placement.ts`), and the geometry to map it onto comes from `crt-pc`.

### The geometry, using the ceramic mug as the worked example

```jsonc
"product": {
  "id": 14937, "name": "Керамична Чаша", "model": "CHASHA-EM-1",
  "canvas_index_width": "12.00",     // canvas units per cm
  "canvas_index_height": "16.00"
},
"product_positions": [
  { "index": 0, "position": 1, "position_name": "Отпред",
    "canvas_width": "250", "canvas_height": "140",
    "canvas_top": "80", "canvas_left": "-15",
    "image": "https://printondemand.bg/gallery/real/chasha_center_1.png" },
  { "index": 1, "position": 2, "position_name": "Отляво",  "canvas_width": "140", "canvas_height": "180", "canvas_top": "75", "canvas_left": "50" },
  { "index": 2, "position": 3, "position_name": "Отдясно", "canvas_width": "140", "canvas_height": "180", "canvas_top": "75", "canvas_left": "35" }
]
```

`updateObjectSize` converts a size the user types in millimetres to canvas
pixels as `round(mm * canvas_index_width / 10)`, so `canvas_index_*` is the
scale factor between our print area and theirs. The `image` per position is
their own photograph of the blank — usable as the mockup background, which
removes the stand-in product photography problem at the same time.

## So the flow that works today

1. Customer personalises on Menty; we render a print-ready PNG as we already do.
2. Server posts it to `/v2/crt-spd`, creating a one-off product in the account.
3. `GET /api/products` returns it with a real `product_id` and per-size prices.
4. `POST /api/checkout/checkout` (type 3) orders it — the documented, supported path.

Only step 2 is unsanctioned.

## Before relying on step 2

`/v2/crt-spd` is a panel route, not a product. It authenticates with a session
cookie and a CSRF token, not the bearer token, it is versioned by the asset
string `laravel-client.app.js?v=63.6.1`, and it can change without notice or
warning. Driving it from a server means holding a login session for the account,
which is a materially worse credential to store than an API token.

So it is a bridge, not a foundation. The point of writing it down is that the
question to their support is now answerable in one line:

> Панелът създава продукт с дизайн през `POST /v2/crt-spd` (base64 PNG в `files[].src`).
> Може ли същото да се извика с Bearer токена от CLIENT API v2.2? Правим
> персонализирани продукти — всяка поръчка е нов дизайн.

They have Shopify and WooCommerce integrations (`/v2/integrations/shopify/manager`,
`/v2/integrations/wo-commerce/manager`), which cannot work without exactly this
capability existing internally. That is the argument to make.

## Also worth knowing

- The account's currency is already EUR (`uData.currency.code === "EUR"`), which
  matches the shop and settles the deviation noted in `lib/shop/products.ts`.
- `/v2/ai/gallery` and `/v2/ai/credits` — they sell AI image generation and
  mockups (`/v2/ai/mockup/product-images`). Not needed; we generate our own.
- `/v2/sp-*` is a "single product" flow (`sp-d`, `sp-s` store, `sp-c` checkout,
  `sp-t` templates) — worth a look if `crt-spd` turns out to be the wrong door.
- Endpoints in v2.2 we have not wired yet: `/api/deliveries`, `/api/recipients`,
  `/api/extra/types`, `/api/extra/stikers`, `/api/labels`, and the
  `order/payments` + `delivery/signature` nomenclatures.

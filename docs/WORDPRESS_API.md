# Maso — WordPress API for the HTML/CSS/JS version

This document is for the WordPress developer. It describes the same REST
contract as the Next.js version (branch `main`), so one WordPress plugin
serves both. The website never reads raw WordPress/WooCommerce/ACF data: it
calls a small custom REST namespace, **`/wp-json/maso/v1`**, that returns
exactly the JSON shapes below. Everything else (admin, WooCommerce, SMS,
payment gateways, ACF) stays on the WordPress side.

**What is different in this version:** there is no Node server. The pages
are plain files and the browser calls WordPress directly, so:

* set `WP_URL` in `assets/js/config.js` to switch from sample data to WordPress;
* the endpoints need **CORS** unless the site and WordPress share a domain
  (see §10);
* there is no revalidation webhook — use normal HTTP caching (see §1);
* links in the data (`/shop/beds`) are mapped to the static pages
  (`shop.html?category=beds`) by the site; WordPress keeps sending site paths.

* Every shape has a complete example in
  [`assets/js/data/mock.js`](../assets/js/data/mock.js) (the sample data the
  site runs on until `WP_URL` is set). Field names here match it.
* All text is Persian. Prices are **integers in Toman**. Dates are ISO 8601.
* Images are `Media` objects with **real pixel dimensions** (needed to avoid
  layout shift):

```jsonc
// Media
{ "src": "https://cms.masogroup.co/wp-content/uploads/2026/09/bed.jpg", "width": 1360, "height": 1360, "alt": "تخت دونفره همدم" }
// VideoMedia — src may be "" (then the poster is shown)
{ "src": "https://…/hero.mp4", "poster": { /* Media */ } }
// Link
{ "label": "فروشگاه", "href": "/shop" }
```

`href` values are **site paths** (`/shop/beds`, `/product/hamdam-bed`), not
WordPress permalinks.

> The static pages that carry fixed content (home page, header, footer,
> login, 404, maintenance) contain that content directly in their HTML. When
> you turn this into a WordPress theme, render those parts from the same
> fields in PHP (the markup and class names stay as they are), or fetch
> `/maso/v1/settings` and `/maso/v1/home` and fill them in.

---

## 1. Caching

The browser calls the GET endpoints directly, so their HTTP cache headers
decide how fresh pages are. Suggested:

| Endpoint group | `Cache-Control` |
| --- | --- |
| settings, home, categories, facets, promo, custom-order | `public, max-age=300, stale-while-revalidate=3600` |
| products, product detail, search | `public, max-age=120, stale-while-revalidate=600` |
| checkout locations, payment methods | `public, max-age=86400` |
| quote, coupon, order, auth, forms (POST) and order status | `no-store` |

A page-cache plugin or a CDN in front of `/wp-json/maso/v1` (GET only) keeps
WordPress load low. Within one page view the site also reuses each GET answer.

---

## 2. Site settings

`GET /maso/v1/settings` → `SiteSettings`

```jsonc
{
  "headerNav": [{ "label": "محصولات", "href": "/shop" }, { "label": "فروشگاه", "href": "/shop" }],
  "mobileNav": [{ "label": "فروشگاه", "href": "/shop" }, { "label": "سفارش اختصاصی", "href": "/custom-order" }],
  "popularSearches": ["مبل راحتی", "تخت دونفره", "میز ناهارخوری", "صندلی", "کنسول و آینه"],
  "loginBackground": { "src": "", "poster": { /* Media */ } },
  "footer": {
    "columns": [[/* Link */], [/* Link */]],
    "address": { "label": "آدرس دفتر مرکزی", "value": "…" },
    "phones": { "label": "مشاوره و فروش", "values": ["09199900671", "017-34349679"] },
    "email": { "label": "ایمیل", "value": "info@masogroup.co" },
    "socials": { "instagram": "https://…", "telegram": "https://…", "whatsapp": "https://…" },
    "copyright": "…",
    "about": "…",
    "legal": [{ "label": "شرایط استفاده", "href": "/terms-of-use" }],
    "video": { /* VideoMedia */ }
  }
}
```

## 3. Home page

`GET /maso/v1/home` → `HomePage`

See the `HomePage` shape (`CategoryTile`, `Banner`, `PostCard`) in the
example in `assets/js/data/mock.js` (and the content of `index.html`). Notes:

* `categories[]` are in **mobile order** (top → bottom). `size: "half" | "full"`,
  `textPosition: "top" | "bottom"`, optional `mediaAlign`.
* Banners carry per-breakpoint backgrounds: `background.mobile` (required),
  `tablet`, `desktop` (optional; fall back to mobile).
* `journal.posts` — 3 latest posts (`PostCard`).

## 4. Shop

| Endpoint | Returns |
| --- | --- |
| `GET /maso/v1/shop/categories` | `ShopCategory[]` |
| `GET /maso/v1/shop/facets?category=<slug>` | `FilterFacet[]` (filters for that category, or all) |
| `GET /maso/v1/shop/promo?category=<slug>` | `ShopPromo` or `null` |
| `GET /maso/v1/shop/products?…` | `ProductPage` |
| `GET /maso/v1/shop/products/<slug>` | `ProductDetail`, or **404** |

(`/shop/products/featured`, used by the Next.js version to prerender best
sellers, is not needed here.)

### `GET /maso/v1/shop/products`

Query parameters (the site's URL format is passed through):

| Param | Example | Meaning |
| --- | --- | --- |
| `category` | `beds` | category slug (optional) |
| `sort` | `newest` (default), `price-desc`, `price-asc` | |
| `stock` | `1` | only in-stock products |
| `page` | `2` | 1-based |
| `per_page` | `12` | always 12 |
| *any facet key* | `wood=walnut,oak&material=solid` | comma-separated facet values (OR inside a facet, AND between facets) |

Facet keys and values are whatever `/shop/facets` returns (e.g. `wood`
attribute → `pa_wood` terms). Response:

```jsonc
{ "items": [/* ProductSummary */], "page": 1, "totalPages": 3, "total": 30 }
```

`ProductSummary`: `slug, name, capacity?, shortDescription, price, regularPrice? (only when on sale), image, swatches[] ({name, image}), inStock`.

### `ProductDetail`

The product page is driven by `optionGroups` (WooCommerce attributes /
variations):

```jsonc
{
  "slug": "hamdam-bed",
  "name": "تخت دونفره مدل همدم",
  "deliveryDays": 45,
  "breadcrumbs": [{ "label": "فروشگاه", "href": "/shop" }, { "label": "تخت و سرویس خواب", "href": "/shop/beds" }],
  "images": [/* Media, square, ≥ 680px */],
  "basePrice": 0,                       // only when there is no size group
  "optionGroups": [
    {
      "key": "size", "label": "سایز‌ها", "selectedLabel": "انتخاب‌ها", "pickerTitle": "سایز‌ها", "kind": "size",
      "options": [{ "id": "queen", "name": "کویین", "detail": "عرض ۱۶۰cm", "price": 1500000000 }]
    },
    {
      "key": "wood", "label": "رنگ چوب", "pickerTitle": "رنگ چوب", "kind": "swatch",
      "options": [{ "id": "beech-walnut", "name": "چوب راش - رنگ گردویی", "priceDelta": 0, "swatch": { /* Media 48×48 */ } }]
    }
  ],
  "features": [{ "text": "مونتاژ آسان با دفترچه راهنما مرحله به مرحله", "icon": { /* Media (SVG ok) */ } }],
  "specs": [{ "label": "بدون صدا", "value": true }, { "label": "وزن", "value": "۱۳۵ kg" }],
  "specsVisible": 7,
  "space": { "rows": [{ "label": "کل فضای اشغالی", "value": "۱۶ m²" }], "diagram": { /* Media */ }, "width": "۱۸۰ cm", "depth": "۲۰۰ cm" },
  "descriptionHtml": "<p>…</p>",          // sanitised HTML from the editor
  "faqs": [{ "question": "…", "answer": "…" }],
  "test": {                              // "سفارش تست محصول" — omit if not offered
    "price": 1500000, "notice": "…", "intro": ["…"],
    "example": { "wood": { /* ProductOption */ }, "fabric": { /* ProductOption */ }, "image": { /* Media */ } }
  }
}
```

Pricing rule used on the site (please mirror it in WooCommerce):
**price = chosen size `price` (or `basePrice`) + Σ `priceDelta` of the chosen finishes.**
The site only shows a price once every group has a choice.

## 5. Search

`GET /maso/v1/search?q=<term>&limit=8` → `SearchHit[]` (`slug, name, price, regularPrice?, image`)

The term is already normalised (Arabic ي/ك → Persian ی/ک, trimmed). Match
product titles (and ideally SKUs/tags), best match first. 

## 6. Accounts (SMS one-time code)

Login and registration are one flow. WordPress sends the SMS and issues a
session token; the site keeps it in the browser (localStorage,
`maso-session-v1`) and sends it as `Authorization: Bearer <token>` on every
request. If the site and WordPress share a domain you may instead set your
own httpOnly cookie in the verify response and ignore the header.

| Endpoint | Body | Response |
| --- | --- | --- |
| `POST /maso/v1/auth/otp` | `{ "mobile": "09123456789" }` | `{ "resendIn": 120, "length": 4 }` · `429` when rate-limited |
| `POST /maso/v1/auth/verify` | `{ "mobile": "09123456789", "code": "1234" }` | `{ "token": "…", "customer": { "id", "mobile", "firstName?", "lastName?" }, "isNew": false }` · **`422`** for a wrong/expired code |

Please rate-limit both per number and per IP, expire codes after ~2 minutes,
and allow ~5 attempts per code.

## 7. Checkout

The cart lives in the browser. For pricing and ordering the site sends only
**slugs, option ids and quantities** — WooCommerce re-prices everything:

```jsonc
// CartLineInput
{ "slug": "hamdam-bed", "kind": "product", "optionIds": ["queen", "beech-walnut", "velvet-blue"], "qty": 1 }
// kind "test" = the 30×30 sample of a product (optionIds = chosen wood & fabric)
```

| Endpoint | Body → Response | Cache |
| --- | --- | --- |
| `GET /maso/v1/checkout/locations` | → `Province[]` (`{ id, name, cities: [{ id, name }] }`) | cacheable |
| `GET /maso/v1/checkout/payment-methods` | → `PaymentMethod[]` | cacheable |
| `POST /maso/v1/checkout/quote` | `{ lines, provinceId?, cityId?, coupon? }` → `CheckoutQuote` | never |
| `POST /maso/v1/checkout/coupon` | `{ code, lines }` → `{ "ok": true }` or `{ "ok": false, "error": "کد تخفیف معتبر نیست." }` | never |
| `POST /maso/v1/checkout/order` | `{ lines, address, paymentMethodId, coupon? }` → `{ orderId, redirectUrl }` | never |
| `GET /maso/v1/checkout/order/<orderId>` | → `OrderResult` | never |

### `CheckoutQuote`

```jsonc
{
  "itemsCount": 2,
  "rows": [                                   // shown top to bottom in "جزئیات پرداخت"
    { "label": "اقلام (۲)", "amount": 3000000000 },
    { "label": "مالیات", "amount": 300000000 },
    { "label": "هزینه بیمه", "amount": 15000000 },
    { "label": "بسته بندی", "amount": 1500000 },
    { "label": "ارسال", "text": "رایگان" }    // text instead of amount: "رایگان" / "پس کرایه"
  ],
  "discount": { "code": "MASO10", "amount": 300000000, "percent": 10 },   // only with a valid coupon
  "payable": 3016500000,                      // "قابل پرداخت"
  "shipping": {                               // once a city is known
    "id": "freight",
    "title": "ارسال با باربری / قطار",
    "description": "تحویل توسط شما در باربری مقصد",
    "notice": "… (orange box; \n = line break)",
    "branded": false                          // true = in-house delivery (Maso logo shown)
  }
}
```

Which cities get **"سرویس ویژه ماسو"** (in-house delivery) vs freight/train is
your business rule; the site just shows what the quote returns.

### `PaymentMethod`

```jsonc
{ "id": "online", "title": "پرداخت اینترنتی", "description": "در پرداخت سداد", "icon": "card", "logo": { /* Media */ } }
{ "id": "installments", "title": "پرداخت ۴ قسطه", "description": "هر قسط", "icon": "installments", "installments": 4, "logo": { /* Media */ } }
```

`icon` is one of `card | split | cheque | installments` (drawn by the site).
For instalment methods the site shows `payable / installments` per instalment.

### Placing the order

`address` is the shopper's delivery address:

```jsonc
{
  "id": "…", "firstName": "مهراد", "lastName": "…", "mobile": "09123456789",
  "provinceId": "gil", "cityId": "gil-1", "provinceName": "گیلان", "cityName": "رشت",
  "street": "رشت، بلوار گیلان، خ ۱۲۲", "plaque": "12", "unit": "3", "postalCode": "1234567890",
  "location": { "lat": 37.28, "lng": 49.58 }       // pin from the map (optional)
}
```

Create the WooCommerce order, then return `redirectUrl`:

* online payment → the **bank gateway URL** (absolute);
* offline methods (cheque, split payment arranged by phone) →
  `/checkout/result?order=<id>` (the site maps this to `checkout-result.html?order=<id>`).

The gateway callback must land on WordPress (verify the transaction there),
then redirect the shopper to
`https://masogroup.co/checkout-result.html?order=<orderId>`. That page calls
`GET /maso/v1/checkout/order/<orderId>`:

```jsonc
{
  "orderId": "95062598", "status": "paid",        // "paid" | "failed" | "pending"
  "orderNumber": "12342341234", "trackingCode": "…", "transactionId": "190-8748923704",
  "date": "2026-07-27T08:32:00Z",
  "rows": [/* TotalsRow, as in the quote */]
}
```

On `paid` the site empties the cart. Saved addresses are kept in the browser
for now; once accounts are live they can move to
`GET/POST/DELETE /maso/v1/account/addresses` (same `Address` shape).

## 8. Custom order ("سفارش اختصاصی")

| Endpoint | | |
| --- | --- | --- |
| `GET /maso/v1/custom-order` | → `{ "showcase": [{ "before": Media, "after": Media }] }` | cacheable |
| `POST /maso/v1/forms/custom-order` | `multipart/form-data`: `name`, `mobile`, `message`, `images[]` (1–3 JPEG/PNG, ≤ 5 MB each, already shrunk to ≤ 2000px by the browser) → `{ "requestId": "1234234123" }` | never |

Store the request (e.g. a CPT or Gravity/Contact Form entry), notify sales,
and return a human-friendly request number.

## 9. Errors

* `404` from `/shop/products/<slug>` → the site shows its 404 page.
* Any other non-2xx or a timeout (15 s, 60 s for uploads) → the site shows
  a friendly error and logs it. Error bodies are not displayed, except the
  `error` strings explicitly listed above (coupon).

## 10. CORS / security

The browser calls WordPress directly.

* **Same domain** (e.g. the site at `masogroup.co` and WordPress under
  `masogroup.co/cms`): nothing to do.
* **Different domains** (e.g. `masogroup.co` → `cms.masogroup.co`): answer
  `/wp-json/maso/v1/*` with
  `Access-Control-Allow-Origin: https://masogroup.co`,
  `Access-Control-Allow-Headers: Content-Type, Authorization`,
  `Access-Control-Allow-Methods: GET, POST, OPTIONS`, and handle the
  `OPTIONS` preflight (`rest_pre_serve_request` / `rest_send_cors_headers`).

Because requests come from shoppers' browsers, rate-limit the POST endpoints
per IP (auth, coupon, forms), validate every field again on the server, and
never trust prices sent by the browser (the site only sends slugs, option ids
and quantities).

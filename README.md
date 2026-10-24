# Maso Group — website (HTML, CSS & JavaScript)

The Maso storefront as **plain HTML, CSS and JavaScript** — no framework, no
server, no build step needed to run it. It is the same design as the
Next.js version on the `main` branch (Figma *Maso Group Website*, Persian /
RTL, widths **402 / 768 / 1266 / 1440**), checked side by side against it
screenshot by screenshot. The pages designed after that (contact, about,
blog, profile) and the new header with the mega menu exist only in this
version so far.

## Look at it

* **Quickest:** double-click `index.html`. Everything works from disk.
* **Like a real server** (recommended, e.g. for the 404 page):
  `npm run serve` → <http://localhost:8080> (needs Node 18+; any web server works too).

It runs on built-in sample data until WordPress is connected. Try:
one-time code **12345** everywhere (login, changing the number in the profile,
confirming the number at checkout) · coupons
**MASO10** / **WELCOME** · coupon **FAIL** → failed-payment page.

## Pages

| Page | File | Next.js route |
| --- | --- | --- |
| Home | `index.html` | `/` |
| Shop, category | `shop.html`, `shop.html?category=beds` | `/shop`, `/shop/beds` |
| Product | `product.html?slug=hamdam-bed` | `/product/hamdam-bed` |
| Search | `search.html?q=…` (and the overlay in the header) | `/search` |
| Cart → shipping → payment → result | `cart.html`, `checkout-shipping.html`, `checkout-payment.html`, `checkout-result.html` | `/cart`, `/checkout/*` |
| Login / register | `login.html` | `/login` |
| Custom order | `custom-order.html` | `/custom-order` |
| 404, maintenance | `404.html`, `maintenance.html` | — |
| Contact (support) | `contact.html` | — |
| About us | `about.html` | — |
| Blog, article | `blog.html`, `blog-post.html?slug=minimal-furniture-arrangement` | — |
| Profile (signed in) | `profile.html`, `?view=info` · `addresses` · `orders&tab=pre\|current\|delivered\|returned` · `order&id=40017` | — |

The header (every page, 80px tall, content 900px wide) has the «محصولات»
mega menu and a «فروشگاه» link on desktop, and the frosted full-screen menu
with a categories screen on phones and tablets.
The account icon leads to the login page, or to the profile once signed in.

Only the terms page (`terms.html`, linked from the footer) isn't designed
yet; it shows the 404 page until the file exists.

## Files

```
*.html                 one file per page (ready to upload)
assets/
  css/main.css         the stylesheet (compiled — this is what pages load)
  css/src/main.css     its source: design tokens (Figma variables), base, motion
  js/config.js         ← the only file to edit when going live (WordPress URL, map key)
  js/dist/             what the pages load: minified bundles + source maps (built)
  js/data/mock.js      sample content in the exact WordPress JSON shapes
  js/data/service-areas.js  Tehran & Karaj outlines (where the map step and Maso delivery apply)
  js/core/             shared: helpers, icons, storage (cart…), data layer (api.js),
                       header/menu/sheets (ui.js), search, form fields
  js/pages/            one script per page (shop.js, product.js, cart.js, …)
  fonts/               Yekan Bakh (self-hosted)
  images/              all pictures and logos
  video/               background clips (hero, footer, bed category)
partials/              header, footer, <head> and script list shared by all pages
scripts/build.mjs      bundles the JS, compiles the CSS, copies the partials into the pages
docs/WORDPRESS_API.md  the REST contract for the WordPress developer
.htaccess              404 page, pretty URLs, caching, maintenance switch (Apache/LiteSpeed)
```

### How the pages are built

* **Fixed content** (home page, header, footer, login, 404…) is written
  straight into the HTML.
* **Data-driven parts** (product lists, product page, cart, checkout,
  search) are drawn by the page's script from `Maso.api`, which returns
  either the sample data or the WordPress answer — same shapes either way.
* **Styling** uses utility classes (Tailwind CSS) whose values come from the
  Figma tokens in `assets/css/src/main.css` (`bg-surface-low`, `text-16`,
  `text-on-surface-var` …). The result is an ordinary CSS file; no Tailwind
  is needed in the browser.
* Modals use the native `<dialog>` element (focus trap, Esc, backdrop for
  free) with CSS-only enter/exit animations; scroll reveals use one
  IntersectionObserver; `prefers-reduced-motion` turns animation off.
* Cart, saved addresses, checkout choices, recent searches and the login
  token are kept in `localStorage`.

### Speed

* **Three requests of JavaScript per page** at most: `config.js`, the shared
  `dist/core.js` and the page's own bundle (checkout pages add the shared
  checkout/address bundles). Bundles are minified (about half the size of
  the sources); source maps keep the original files readable in the
  browser's developer tools.
* **Sample data only when needed:** `dist/mock.js` is requested only while
  `WP_URL` is empty — with WordPress connected it is never downloaded.
* **Long caching, instant updates:** every CSS/JS link carries `?v=<hash>`,
  rewritten by each build, so browsers keep those files for a year
  (`vercel.json`, `.htaccess`) yet fetch a new build immediately.
  `config.js` is never cached long, so it can be edited on the server.
* Pictures load lazily (except the first one on screen), videos only play
  — and only download — while visible, scroll effects use
  IntersectionObserver instead of scroll listeners, and the brand font is
  preloaded with a metric-matched fallback (no layout jump).

## Editing

Plain edits to a page's own content need nothing else: change the HTML and
upload it. `assets/js/config.js` can also be edited directly.

Three things are generated, so edit their sources and rebuild:

| To change… | edit | then |
| --- | --- | --- |
| header, footer, `<head>`, script list (all pages) | `partials/*.html` | `npm run build` |
| colours, type sizes, animations — or after adding new utility classes anywhere | `assets/css/src/main.css` / the HTML or JS | `npm run build` |
| any script (pages, data layer, components, sample data) | `assets/js/core`, `pages`, `data` | `npm run build` |

```bash
npm install      # once (installs the Tailwind CLI and esbuild)
npm run build    # or: npm run watch
```

A new page script `assets/js/pages/foo.js` becomes `assets/js/dist/foo.js`
automatically; load it with `<script src="assets/js/dist/foo.js" defer></script>`
after the scripts partial (the build adds the `?v=`). Shared bundles are
listed at the top of `scripts/build.mjs`.

Each page marks where the shared parts go with
`<!-- @include header {"mode":"overlay"} -->…<!-- /@include -->`; the build
replaces what's between the markers. Options are explained at the top of
`scripts/build.mjs`.

## Connecting WordPress

1. The WordPress developer implements the endpoints in
   **[docs/WORDPRESS_API.md](docs/WORDPRESS_API.md)** (same contract as the
   Next.js version, so one plugin serves both).
2. Set `WP_URL` in `assets/js/config.js`, e.g. `"https://cms.masogroup.co"`.
3. If WordPress is on another domain, it must send CORS headers (§10 of the doc).

**Map key:** the address form shows a map only for Tehran and Karaj (form
first, then the map, which can't leave the chosen city). It uses MapTiler
(style "positron"): put the key in `MAPTILER_KEY` in `config.js` and allow
the site's domain on that key in the MapTiler dashboard. Without a key the
map step says so and the address is saved without a position.

Optional: a Neshan **web** key in `config.js` gives the most accurate Persian
street names under the map pin (otherwise MapTiler's geocoding, then OpenStreetMap).

To turn the pages into a WordPress theme instead, the HTML files are the
templates: keep the markup and classes, print the fixed content from PHP,
and leave the scripts as they are.

## Putting it online (Host Iran or any host)

Upload everything **except** `node_modules/`, `partials/`, `scripts/`,
`assets/css/src/`, `package*.json` and `docs/` to the site's root
(`public_html` in cPanel's File Manager — zip, upload, extract). That's it.
(`assets/js/core`, `pages` and `data` are only the sources of the bundles;
uploading them does no harm.)

* `.htaccess` (Apache/LiteSpeed, the usual cPanel servers) sets up the 404
  page, short URLs (`/shop` → `shop.html`), compression and caching.
* **Maintenance mode:** uncomment the three lines marked in `.htaccess`.
* On Nginx, the equivalent is:

  ```nginx
  error_page 404 /404.html;
  location / { try_files $uri $uri.html $uri/ =404; }
  location /assets/ { expires 30d; }
  location ~ ^/assets/(css|js/dist|fonts)/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location = /assets/js/config.js { add_header Cache-Control "no-cache"; }
  ```

* The site should live at the root of its domain (the 404 and maintenance
  pages load their files from `/`).
* Everything is self-hosted (fonts, icons, images, videos); only the map
  (MapTiler's script, styles and tiles) and geocoding come from outside
  (configured in `config.js`). City outlines: geoBoundaries (CC BY 4.0).

## Notes

* The product page, shop and checkout are drawn in the browser, so search
  engines see their content only after JavaScript runs (Google does this).
  The Next.js version renders them on the server; if SEO for product pages
  matters, render them in PHP from the same markup when building the theme.
* Videos (`assets/video/`): the home hero (plus a portrait crop for phones),
  the footer strip and the "تخت و سرویس خواب" tile. They are H.264 MP4s
  without sound, each with its first frame as the poster; the footer and the
  tile download only when they scroll into view, and "reduce motion" keeps
  the posters. The login background is still a picture.
* Pictures for the new pages (about, contact, blog samples) were exported from
  the Figma file at their drawn size. Before launch, replace them with the
  original photos at 2× (same file names in `assets/images/about/`,
  `contact/`, `blog/`) so they stay sharp on retina screens. Blog and product
  pictures normally come from WordPress anyway.
* The contact page's map is a picture that links to Google Maps; put the
  office's exact pin in the link in `contact.html`.

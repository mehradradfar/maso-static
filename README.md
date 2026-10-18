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
login code **1234** (also for changing the number in the profile) · coupons
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

The header (every page) has the "کتگوری‌ها" mega menu on desktop and the
frosted full-screen menu with a categories screen on phones and tablets.
The account icon leads to the login page, or to the profile once signed in.

Only the terms page (`terms.html`, linked from the footer) isn't designed
yet; it shows the 404 page until the file exists.

## Files

```
*.html                 one file per page (ready to upload)
assets/
  css/main.css         the stylesheet (compiled — this is what pages load)
  css/src/main.css     its source: design tokens (Figma variables), base, motion
  js/config.js         ← the only file to edit when going live (WordPress URL, map)
  js/data/mock.js      sample content in the exact WordPress JSON shapes
  js/core/             shared: helpers, icons, storage (cart…), data layer (api.js),
                       header/menu/sheets (ui.js), search, form fields
  js/pages/            one script per page (shop.js, product.js, cart.js, …)
  fonts/               Yekan Bakh (self-hosted)
  images/              all pictures and logos
  vendor/leaflet/      map library for the address picker (self-hosted)
partials/              header, footer, <head> and script list shared by all pages
scripts/build.mjs      copies the partials into the pages + compiles the CSS
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

## Editing

Plain edits to a page's own content need nothing else: change the HTML and
upload it.

Two things are generated, so edit their sources and rebuild:

| To change… | edit | then |
| --- | --- | --- |
| header, footer, `<head>`, script list (all pages) | `partials/*.html` | `npm run build` |
| colours, type sizes, animations — or after adding new utility classes anywhere | `assets/css/src/main.css` / the HTML or JS | `npm run build` |

```bash
npm install      # once (installs the Tailwind CLI only)
npm run build    # or: npm run watch
```

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

Optional: a Neshan **web** key in `config.js` gives accurate Persian street
names on the address map (otherwise OpenStreetMap is used).

To turn the pages into a WordPress theme instead, the HTML files are the
templates: keep the markup and classes, print the fixed content from PHP,
and leave the scripts as they are.

## Putting it online (Host Iran or any host)

Upload everything **except** `node_modules/`, `partials/`, `scripts/`,
`assets/css/src/`, `package*.json` and `docs/` to the site's root
(`public_html` in cPanel's File Manager — zip, upload, extract). That's it.

* `.htaccess` (Apache/LiteSpeed, the usual cPanel servers) sets up the 404
  page, short URLs (`/shop` → `shop.html`), compression and caching.
* **Maintenance mode:** uncomment the three lines marked in `.htaccess`.
* On Nginx, the equivalent is:

  ```nginx
  error_page 404 /404.html;
  location / { try_files $uri $uri.html $uri/ =404; }
  location /assets/ { expires 7d; }
  ```

* The site should live at the root of its domain (the 404 and maintenance
  pages load their files from `/`).
* Everything is self-hosted (fonts, icons, map library); only the map tiles
  and geocoding are fetched from outside (configurable in `config.js`).

## Notes

* The product page, shop and checkout are drawn in the browser, so search
  engines see their content only after JavaScript runs (Google does this).
  The Next.js version renders them on the server; if SEO for product pages
  matters, render them in PHP from the same markup when building the theme.
* Videos (hero, footer, login background) are pictures for now; each spot
  has a comment showing where to put a `<video>`.
* Pictures for the new pages (about, contact, blog samples) were exported from
  the Figma file at their drawn size. Before launch, replace them with the
  original photos at 2× (same file names in `assets/images/about/`,
  `contact/`, `blog/`) so they stay sharp on retina screens. Blog and product
  pictures normally come from WordPress anyway.
* The contact page's map is a picture that links to Google Maps; put the
  office's exact pin in the link in `contact.html`.

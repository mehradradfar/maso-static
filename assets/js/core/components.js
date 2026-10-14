/**
 * Small render functions shared by several pages. Each returns markup
 * (Maso.html) to drop into a template; behaviour is wired by the page.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, url, cx } = Maso;

  /**
   * <img> for a WordPress media object. Lazy by default; pass
   * { eager: true } for pictures above the fold.
   */
  function img(media, { cls = "", alt, eager = false, sizes, width, height } = {}) {
    return html`<img
      src="${url.media(media.src)}"
      alt="${alt ?? media.alt ?? ""}"
      width="${width ?? media.width}"
      height="${height ?? media.height}"
      ${eager ? html`fetchpriority="high"` : html`loading="lazy"`}
      decoding="async"
      ${sizes ? html`sizes="${sizes}"` : ""}
      class="${cls}"
    />`;
  }

  /**
   * Price block from the product card:
   *   ۱,۴۸۰,۰۰۰,۰۰۰ تومان          (20px bold + toman sign, 10px gap)
   *   ۲۰۰,۰۰۰,۰۰۰  [- ۱۰٪]          (struck-through old price + red badge)
   * size "md": 20px bold (cards) · "sm": 16px regular (search rows, cart)
   */
  function price({ price, regularPrice, size = "md", cls = "" }) {
    const discount = regularPrice && regularPrice > price ? Math.round((1 - price / regularPrice) * 100) : 0;
    return html`
      <div class="${cx("flex shrink-0 flex-col items-start gap-1", cls)}">
        <p class="flex items-center gap-2.5 text-ink">
          <span class="${size === "md" ? "text-20 font-bold" : "text-16"}">${fmt.price(price)}</span>
          ${icon("toman")}
        </p>
        ${discount > 0 &&
        html`<p class="flex items-start gap-2">
          <del class="text-13 text-ink-muted"><span class="sr-only">قیمت قبل: </span>${fmt.price(regularPrice)}</del>
          <span dir="ltr" class="rounded-full bg-error px-1 text-13 text-on-error"><span class="sr-only">تخفیف </span>${`- ${fmt.digits(discount)}٪`}</span>
        </p>`}
      </div>
    `;
  }

  /**
   * Overlapping 24px finish swatches with an inner shadow, preceded by a "+N"
   * bubble for the rest. Drawn left-to-right like the design, independent of RTL.
   */
  function swatches(list) {
    if (!list.length) return "";
    const VISIBLE = 3;
    const extra = list.length - VISIBLE;
    return html`
      <div dir="ltr" class="flex items-center" role="img" aria-label="${`رنگ‌بندی: ${list.map((s) => s.name).join("، ")}`}">
        ${extra > 0 &&
        html`<span class="relative -me-1 flex size-6 items-center justify-center rounded-full bg-surf-container text-14 leading-none text-primary">${`+${fmt.digits(extra)}`}</span>`}
        ${list.slice(0, VISIBLE).map(
          (s) => html`<span class="relative -me-1 size-6 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_5px_2px_rgba(0,0,0,0.25)] last:me-0">
            ${img(s.image, { alt: "", width: 24, height: 24, cls: "size-full object-cover" })}
          </span>`,
        )}
      </div>
    `;
  }

  /** Round swatch of an option (24px in cards, 40px in pickers) */
  function swatchDot(option, size = 24) {
    return html`<span
      class="relative shrink-0 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_5px_2px_rgba(0,0,0,0.25)]"
      style="width:${size}px;height:${size}px"
      >${img(option.swatch, { alt: "", width: size, height: size, cls: "size-full object-cover" })}</span
    >`;
  }

  /**
   * Product card (Figma "Frame 1000004115"): 375px picture with a 4px primary
   * underline, then name/capacity, divider, short description, and the
   * swatches + price row. Width comes from the grid.
   */
  function productCard(product, { index = 0, eager = false } = {}) {
    return html`
      <article data-reveal style="--reveal-index:${index % 3}" class="group relative flex flex-col gap-4">
        <div class="relative h-[375px] overflow-hidden border-b-4 border-primary bg-linear-to-b from-[#677b9c] to-[#e0ebff]">
          ${img(product.image, {
            alt: product.image.alt || product.name,
            eager,
            cls: "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]",
          })}
          ${!product.inStock &&
          html`<span class="absolute start-4 top-4 rounded-full bg-surface/90 px-3 py-1 text-13 text-ink-var">ناموجود</span>`}
        </div>
        <div class="flex flex-col gap-4 px-6">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-25 text-ink">
              <!-- The whole card is clickable through this link's ::after -->
              <a href="${url.product(product.slug)}" class="after:absolute after:inset-0">${product.name}</a>
            </h3>
            ${product.capacity && html`<span class="shrink-0 text-13 text-outline">${product.capacity}</span>`}
          </div>
          <hr class="border-0 border-t border-black-10" />
          <p class="text-13 text-ink-var">${product.shortDescription}</p>
          <div class="flex items-center justify-between">
            ${price({ price: product.price, regularPrice: product.regularPrice })} ${swatches(product.swatches)}
          </div>
        </div>
      </article>
    `;
  }

  /** Loading placeholder in the style of the Figma skeleton frame */
  const block = (cls) => html`<div class="${cx("animate-pulse rounded-[6px] bg-skeleton", cls)}"></div>`;

  function productCardSkeleton() {
    return html`
      <div aria-hidden="true" class="flex flex-col gap-4">
        <div class="h-[375px] animate-pulse bg-skeleton"></div>
        <div class="flex flex-col gap-4 px-6">
          <div class="flex items-center justify-between">${block("h-[39px] w-[150px]")} ${block("h-5 w-16")}</div>
          ${block("h-10 w-full")}
          <div class="flex items-center justify-between">${block("h-[31px] w-[150px]")} ${block("h-6 w-20")}</div>
        </div>
      </div>
    `;
  }

  /**
   * "فروشگاه / تخت" trail under the header on shop pages. Ancestors are
   * on-surface-var, the current page is full black; "/ " belongs to the
   * following crumb, exactly like the design.
   * size "compact": 8px vertical padding (listing) · "roomy": 16px (product page)
   */
  function breadcrumbs(items, { size = "compact", cls = "" } = {}) {
    return html`
      <nav aria-label="مسیر صفحه" class="${cx(size === "compact" ? "px-4 py-2 md:px-12" : "p-4 md:px-12", cls)}">
        <ol class="no-scrollbar mx-auto flex max-w-[900px] items-start gap-2 overflow-x-auto text-16 whitespace-nowrap">
          ${items.map((item, i) => {
            const slash = i > 0 && html`<span aria-hidden="true">/ </span>`;
            return html`<li class="shrink-0">
              ${i === items.length - 1
                ? html`<span aria-current="page" class="text-ink">${slash}${item.label}</span>`
                : html`<a href="${url.page(item.href)}" class="text-ink-var transition-colors hover:text-ink">${slash}${item.label}</a>`}
            </li>`;
          })}
        </ol>
      </nav>
    `;
  }

  /** Structured data for search engines */
  function jsonLd(data) {
    return Maso.raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`);
  }

  Maso.ui = { img, price, swatches, swatchDot, productCard, productCardSkeleton, block, breadcrumbs, jsonLd };
})();
